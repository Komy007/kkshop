import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import { sendOrderStatusEmail } from '@/lib/mail';
import { logAudit, getIpFromRequest } from '@/lib/audit';

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> },
) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes((session.user as any).role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { id: orderId } = await context.params;
        const body = await request.json();
        const { carrier, trackingNumber, trackingUrl, memo } = body;

        if (!carrier || !trackingNumber) {
            return NextResponse.json({ error: 'Carrier and tracking number are required' }, { status: 400 });
        }

        // Check if order exists
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Use a transaction to create the shipment and update the order status
        const result = await prisma.$transaction(async (tx) => {
            // Upsert shipment just in case admin is updating an existing one
            const shipment = await tx.orderShipment.upsert({
                where: { orderId },
                update: {
                    carrier,
                    trackingNumber,
                    trackingUrl: trackingUrl || null,
                    memo: memo || null,
                    updatedAt: new Date()
                },
                create: {
                    orderId,
                    carrier,
                    trackingNumber,
                    trackingUrl: trackingUrl || null,
                    memo: memo || null,
                    shippedAt: new Date(),
                }
            });

            // If order was PENDING or CONFIRMED, move it to SHIPPING
            if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
                await tx.order.update({
                    where: { id: orderId },
                    data: { status: 'SHIPPING' }
                });
            }

            return shipment;
        });

        // 배송 시작 이메일 발송 (non-blocking — 이메일 실패가 응답을 막지 않음)
        if (order.customerEmail && (order.status === 'PENDING' || order.status === 'CONFIRMED')) {
            sendOrderStatusEmail(
                order.customerEmail,
                orderId,
                'SHIPPING',
                { carrier, trackingNumber, trackingUrl: trackingUrl || null }
            ).catch((e) => console.error('Shipment email failed (non-critical):', e));
        }

        // 감사 로그 기록 (non-blocking)
        if (session.user?.id) {
            logAudit({
                userId: session.user.id,
                userEmail: session.user.email ?? 'admin',
                userRole: (session.user as any).role ?? 'ADMIN',
                action: 'ADD_SHIPMENT',
                resource: 'Order',
                resourceId: orderId,
                details: { carrier, trackingNumber },
                ipAddress: getIpFromRequest(request),
            }).catch((e) => console.error('Audit log failed:', e));
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('Failed to create/update shipment:', error);
        return NextResponse.json({ error: 'Failed to update shipment' }, { status: 500 });
    }
}
