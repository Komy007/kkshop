import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const orders = await prisma.order.findMany({
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                translations: {
                                    where: { langCode: 'ko' },
                                    select: { name: true }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Serialize BigInt and Decimal
        const safe = orders.map(o => ({
            ...o,
            totalUsd: o.totalUsd.toString(),
            subtotalUsd: o.subtotalUsd.toString(),
            shippingFee: o.shippingFee.toString(),
            discountAmount: o.discountAmount.toString(),
            items: o.items.map(i => ({
                ...i,
                priceUsd: i.priceUsd.toString(),
                productId: i.productId.toString(),
            }))
        }));

        return NextResponse.json(safe);
    } catch (error) {
        console.error('GET /api/admin/orders error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
