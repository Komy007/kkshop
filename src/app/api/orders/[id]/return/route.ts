/**
 * POST /api/orders/[id]/return
 * 고객이 배송 완료된 주문에 반품을 요청합니다.
 *
 * 조건:
 *  - 로그인 필요
 *  - order.status === 'DELIVERED' (배송 완료된 주문만 반품 가능)
 *  - 본인 주문만 요청 가능
 *  - 이미 반품 요청된 주문 불가 (ReturnRequest 중복 방지)
 *
 * 처리:
 *  - ReturnRequest 레코드 생성 (status: PENDING)
 *  - Order.status → 'RETURN_REQUESTED'
 *  - 관리자에게 이메일 알림 (선택)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { ReturnRequestSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(
    req: Request,
    context: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id: orderId } = await context.params;

    // Zod 입력 검증
    const body = await req.json();
    const parsed = ReturnRequestSchema.safeParse(body);
    if (!parsed.success) {
        const msg = parsed.error.errors[0]?.message ?? '반품 사유를 입력해 주세요.';
        return NextResponse.json({ error: msg }, { status: 400 });
    }
    const { reason } = parsed.data;

    // 주문 조회
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true },
    });

    if (!order) {
        return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 본인 주문인지 확인
    if (order.userId !== session.user.id) {
        return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 배송 완료 상태인지 확인
    if (order.status !== 'DELIVERED') {
        return NextResponse.json(
            { error: '배송 완료된 주문만 반품 요청이 가능합니다.' },
            { status: 400 },
        );
    }

    // 중복 반품 요청 방지
    const existing = await prisma.returnRequest.findUnique({ where: { orderId } });
    if (existing) {
        return NextResponse.json(
            { error: '이미 반품 요청이 접수된 주문입니다.' },
            { status: 409 },
        );
    }

    // ReturnRequest 생성 + Order 상태 업데이트 (트랜잭션)
    await prisma.$transaction([
        prisma.returnRequest.create({
            data: {
                orderId,
                userId:  session.user.id,
                reason,
                status: 'PENDING',
            },
        }),
        prisma.order.update({
            where: { id: orderId },
            data:  { status: 'RETURN_REQUESTED' },
        }),
    ]);

    return NextResponse.json({
        success: true,
        message: '반품 요청이 접수되었습니다. 1~3 영업일 내에 처리됩니다.',
    });
}
