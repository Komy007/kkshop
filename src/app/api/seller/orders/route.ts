import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

const PAGE_SIZE = 20;

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'SUPPLIER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ orders: [], total: 0, page: 1, totalPages: 1 }, { status: 200 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const status = searchParams.get('status') || '';
    const skip = (page - 1) * PAGE_SIZE;

    const where: any = {
        items: { some: { product: { supplierId: supplier.id } } },
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            include: {
                items: {
                    where: { product: { supplierId: supplier.id } },
                    include: {
                        product: {
                            select: {
                                brandName: true,
                                imageUrl: true,
                                translations: { where: { langCode: 'en' }, select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: PAGE_SIZE,
        }),
        prisma.order.count({ where }),
    ]);

    const safe = orders.map(o => ({
        ...o,
        items: o.items.map(i => ({
            ...i,
            productId: i.productId.toString(),
            optionId: i.optionId?.toString() ?? null,
        })),
    }));

    return NextResponse.json({
        orders: safe,
        total,
        page,
        totalPages: Math.ceil(total / PAGE_SIZE),
    });
}
