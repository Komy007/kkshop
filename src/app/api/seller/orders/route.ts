import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json([], { status: 200 });

    // Orders that contain products belonging to this supplier
    const orders = await prisma.order.findMany({
        where: {
            items: { some: { product: { supplierId: supplier.id } } },
        },
        include: {
            items: {
                where: { product: { supplierId: supplier.id } },
                include: {
                    product: {
                        select: {
                            brandName: true,
                            imageUrl: true,
                            translations: { where: { langCode: 'ko' }, select: { name: true } },
                        },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });

    return NextResponse.json(orders);
}
