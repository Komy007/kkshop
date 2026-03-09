import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET(request: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                shipment: true,
                items: {
                    include: {
                        product: { select: { imageUrl: true, sku: true } }
                    }
                }
            }
        });

        // Serialize BigInt fields in OrderItem (productId, optionId)
        const safe = orders.map(o => ({
            ...o,
            items: o.items.map(i => ({
                ...i,
                productId: i.productId.toString(),
                optionId: i.optionId?.toString() ?? null,
            })),
        }));

        return NextResponse.json(safe);
    } catch (error) {
        console.error('Failed to fetch user orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
