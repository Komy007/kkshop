import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function requireAdmin(session: any) {
    const role = session?.user?.role;
    if (!role || !['ADMIN', 'SUPERADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const denied  = requireAdmin(session);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const pageSize = Math.min(50, parseInt(searchParams.get('pageSize') ?? '20'));
    const search   = searchParams.get('search') ?? '';
    const status   = searchParams.get('status') ?? '';

    const where: any = {
        status: status && status !== 'ALL'
            ? status
            // RETURN_REQUESTED 추가 — 고객이 반품 요청한 주문도 표시
            : { in: ['CANCELLED', 'REFUNDED', 'RETURN_REQUESTED'] },
        ...(search ? {
            OR: [
                { customerName:  { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
            ],
        } : {}),
    };

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
            skip: (page - 1) * pageSize,
            take: pageSize,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                imageUrl: true,
                                translations: { select: { name: true }, where: { langCode: 'en' }, take: 1 },
                            },
                        },
                    },
                },
                // 고객이 입력한 반품 사유 포함
                returnRequest: {
                    select: { reason: true, status: true, createdAt: true, adminNote: true },
                },
            },
        }),
        prisma.order.count({ where }),
    ]);

    const mapped = orders.map((o: any) => ({
        ...o,
        refundReason: o.returnRequest?.reason ?? null,
        returnStatus: o.returnRequest?.status ?? null,
        items: o.items.map((item: any) => ({
            ...item,
            product: {
                imageUrl: item.product.imageUrl,
                nameEn:   (item.product.translations?.[0] as any)?.name ?? '',
                nameKo:   (item.product.translations?.[0] as any)?.name ?? '',
            },
        })),
    }));

    return NextResponse.json({ orders: mapped, total });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    const denied  = requireAdmin(session);
    if (denied) return denied;

    const { orderId, status, adminNote } = await req.json();

    if (!orderId || !['REFUNDED', 'CANCELLED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
        where:   { id: orderId },
        include: { items: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // 멱등성 보장 — 이미 같은 상태이면 중복 처리 방지
    if (order.status === status) {
        return NextResponse.json({ error: '이미 처리된 주문입니다. Already processed.' }, { status: 409 });
    }
    // 완료된 주문(REFUNDED/CANCELLED)은 재변경 불가
    if (['REFUNDED', 'CANCELLED'].includes(order.status)) {
        return NextResponse.json({ error: '완료된 주문은 변경할 수 없습니다. Order is finalized.' }, { status: 409 });
    }

    // 환불 처리: 전체를 하나의 트랜잭션으로 처리 (중간 실패 시 롤백)
    await prisma.$transaction(async (tx) => {
        if (status === 'REFUNDED') {
            // ① 재고 복원 (update 반환값으로 balanceAfter 계산 — stale read 방지)
            for (const item of order.items) {
                const updated = await tx.product.update({
                    where: { id: item.productId },
                    data:  { stockQty: { increment: item.quantity } },
                });
                await tx.stockLog.create({
                    data: {
                        productId:    item.productId,
                        changeQty:    item.quantity,
                        balanceAfter: updated.stockQty,
                        reason:       'RETURN',
                        memo:         `Refund approved for order ${orderId}`,
                        orderId,
                        createdBy:    session!.user!.email ?? 'admin',
                    },
                });
            }

            if (order.userId) {
                // ② 주문 완료 시 지급된 1% 리워드 포인트 회수 (원자적 decrement)
                const rewardPoints = Math.floor(Number(order.totalUsd) * 0.01);
                if (rewardPoints > 0) {
                    await tx.user.update({
                        where: { id: order.userId },
                        data:  { pointBalance: { decrement: rewardPoints } },
                    });
                    // 0 미만으로 내려가면 0으로 클램프
                    await tx.user.updateMany({
                        where: { id: order.userId, pointBalance: { lt: 0 } },
                        data:  { pointBalance: 0 },
                    });
                    const afterReclaim = await tx.user.findUnique({
                        where: { id: order.userId }, select: { pointBalance: true },
                    });
                    await tx.userPoint.create({
                        data: {
                            userId:       order.userId,
                            amount:       -rewardPoints,
                            reason:       `환불 처리로 리워드 포인트 회수 (주문 #${orderId})`,
                            balanceAfter: afterReclaim?.pointBalance ?? 0,
                            orderId,
                        },
                    });
                }

                // ③ 주문 시 사용한 포인트 환원 (update 반환값으로 balanceAfter 계산)
                if (order.pointsUsed > 0) {
                    const afterRestore = await tx.user.update({
                        where: { id: order.userId },
                        data:  { pointBalance: { increment: order.pointsUsed } },
                    });
                    await tx.userPoint.create({
                        data: {
                            userId:       order.userId,
                            amount:       order.pointsUsed,
                            reason:       `환불 처리로 사용 포인트 환원 (주문 #${orderId})`,
                            balanceAfter: afterRestore.pointBalance,
                            orderId,
                        },
                    });
                }
            }
        }

        // ReturnRequest 상태 업데이트 (있는 경우)
        if (order.userId) {
            const rr = await tx.returnRequest.findUnique({ where: { orderId } });
            if (rr) {
                await tx.returnRequest.update({
                    where: { orderId },
                    data: {
                        status:      status === 'REFUNDED' ? 'APPROVED' : 'REJECTED',
                        adminNote:   adminNote ?? null,
                        processedBy: session!.user!.email ?? 'admin',
                        processedAt: new Date(),
                    },
                });
            }
        }

        await tx.order.update({
            where: { id: orderId },
            data:  {
                status,
                ...(status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}),
            },
        });
    });

    const updated = await prisma.order.findUnique({ where: { id: orderId } });

    return NextResponse.json({ order: updated });
}
