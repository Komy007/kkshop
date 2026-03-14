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
            : { in: ['CANCELLED', 'REFUNDED'] },
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
            },
        }),
        prisma.order.count({ where }),
    ]);

    // Flatten translations for client
    const mapped = orders.map((o: any) => ({
        ...o,
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

    const { orderId, status } = await req.json();

    if (!orderId || !['REFUNDED', 'CANCELLED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Restore stock on refund
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
    }

    const updated = await prisma.order.update({
        where: { id: orderId },
        data:  { status },
    });

    return NextResponse.json({ order: updated });
}
