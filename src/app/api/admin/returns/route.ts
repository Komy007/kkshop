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

    // 환불 처리 시 재고 복원 + 포인트 환원
    if (status === 'REFUNDED') {
        for (const item of order.items) {
            const product = await prisma.product.findUnique({ where: { id: item.productId } });
            const newStock = (product?.stockQty ?? 0) + item.quantity;
            await prisma.product.update({
                where: { id: item.productId },
                data:  { stockQty: { increment: item.quantity } },
            });
            await prisma.stockLog.create({
                data: {
                    productId:    item.productId,
                    changeQty:    item.quantity,
                    balanceAfter: newStock,
                    reason:       'RETURN',
                    memo:         `Refund approved for order ${orderId}`,
                    orderId,
                    createdBy:    session!.user!.email ?? 'admin',
                },
            });
        }

        // ① 주문 완료 시 지급된 1% 리워드 포인트 회수
        if (order.userId) {
            const rewardPoints = Math.floor(Number(order.totalUsd) * 0.01);
            if (rewardPoints > 0) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { pointBalance: true },
                });
                if (currentUser) {
                    const newBalance = Math.max(0, currentUser.pointBalance - rewardPoints);
                    await prisma.user.update({
                        where: { id: order.userId },
                        data:  { pointBalance: newBalance },
                    });
                    await prisma.userPoint.create({
                        data: {
                            userId:       order.userId,
                            amount:       -rewardPoints,
                            reason:       `환불 처리로 리워드 포인트 회수 (주문 #${orderId})`,
                            balanceAfter: newBalance,
                            orderId,
                        },
                    });
                }
            }

            // ② 주문 시 사용한 포인트 환원
            if (order.pointsUsed > 0) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: order.userId },
                    select: { pointBalance: true },
                });
                if (currentUser) {
                    const restoredBalance = currentUser.pointBalance + order.pointsUsed;
                    await prisma.user.update({
                        where: { id: order.userId },
                        data:  { pointBalance: { increment: order.pointsUsed } },
                    });
                    await prisma.userPoint.create({
                        data: {
                            userId:       order.userId,
                            amount:       order.pointsUsed,
                            reason:       `환불 처리로 사용 포인트 환원 (주문 #${orderId})`,
                            balanceAfter: restoredBalance,
                            orderId,
                        },
                    });
                }
            }
        }
    }

    // ReturnRequest 상태 업데이트 (있는 경우)
    if (order.userId) {
        const rr = await prisma.returnRequest.findUnique({ where: { orderId } });
        if (rr) {
            await prisma.returnRequest.update({
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

    const updated = await prisma.order.update({
        where: { id: orderId },
        data:  {
            status,
            ...(status === 'REFUNDED' ? { paymentStatus: 'REFUNDED' } : {}),
        },
    });

    return NextResponse.json({ order: updated });
}
