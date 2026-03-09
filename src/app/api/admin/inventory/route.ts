import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// ── GET: inventory list (all products with stock info) ───────────────────────
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const filter = searchParams.get('filter'); // 'low' = 저재고만

        const products = await prisma.product.findMany({
            include: {
                translations: {
                    where: { langCode: 'ko' },
                    select: { name: true },
                },
                category: { select: { nameKo: true } },
            },
            orderBy: [{ stockQty: 'asc' }, { updatedAt: 'desc' }],
        });

        const mapped = products.map(p => ({
            id: p.id.toString(),
            sku: p.sku,
            brandName: p.brandName,
            imageUrl: p.imageUrl,
            status: p.status,
            stockQty: p.stockQty,
            stockAlertQty: p.stockAlertQty,
            isLowStock: p.stockQty <= p.stockAlertQty,
            priceUsd: p.priceUsd.toString(),
            costPrice: p.costPrice?.toString() ?? null,
            marginPct: (p.costPrice && Number(p.priceUsd) > 0)
                ? Math.round((1 - Number(p.costPrice) / Number(p.priceUsd)) * 100)
                : null,
            category: p.category?.nameKo ?? null,
            name: p.translations[0]?.name ?? p.sku,
            updatedAt: p.updatedAt,
        }));

        const result = filter === 'low' ? mapped.filter(p => p.isLowStock) : mapped;
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('GET /api/admin/inventory error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// ── POST: stock adjustment (재고 조정) ──────────────────────────────────────
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await req.json();
        const { productId, changeQty, reason, memo } = body;

        if (!productId || changeQty === undefined || !reason) {
            return NextResponse.json({ error: 'productId, changeQty, reason required' }, { status: 400 });
        }

        const validReasons = ['RECEIVED', 'RETURN', 'DAMAGED', 'ADJUSTMENT', 'EXPIRED'];
        if (!validReasons.includes(reason)) {
            return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: BigInt(productId) },
            select: { stockQty: true, status: true },
        });
        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

        const delta = parseInt(changeQty);
        const newStock = product.stockQty + delta;
        if (newStock < 0) {
            return NextResponse.json({ error: `Cannot reduce stock below 0 (current: ${product.stockQty})` }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            let newStatus = product.status;
            if (newStock === 0) newStatus = 'SOLDOUT';
            else if (product.status === 'SOLDOUT' && newStock > 0) newStatus = 'ACTIVE';

            await tx.product.update({
                where: { id: BigInt(productId) },
                data: { stockQty: newStock, status: newStatus },
            });

            await (tx as any).stockLog.create({
                data: {
                    productId: BigInt(productId),
                    changeQty: delta,
                    balanceAfter: newStock,
                    reason,
                    memo: memo || null,
                    createdBy: session.user.email ?? null,
                },
            });
        });

        return NextResponse.json({ success: true, newStock });
    } catch (error: any) {
        console.error('POST /api/admin/inventory error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
