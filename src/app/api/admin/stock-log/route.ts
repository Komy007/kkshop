import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// ── GET: stock change history ────────────────────────────────────────────────
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const limit = parseInt(searchParams.get('limit') ?? '100');

        const logs = await (prisma as any).stockLog.findMany({
            where: productId ? { productId: BigInt(productId) } : undefined,
            include: {
                product: {
                    include: {
                        translations: { where: { langCode: 'ko' }, select: { name: true } },
                    },
                    select: {
                        id: true, sku: true, brandName: true, imageUrl: true,
                        translations: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        const safe = logs.map((log: any) => ({
            id: log.id.toString(),
            productId: log.productId.toString(),
            productSku: log.product?.sku,
            productName: log.product?.translations?.[0]?.name ?? log.product?.sku,
            productImage: log.product?.imageUrl,
            changeQty: log.changeQty,
            balanceAfter: log.balanceAfter,
            reason: log.reason,
            memo: log.memo,
            orderId: log.orderId,
            createdBy: log.createdBy,
            createdAt: log.createdAt,
        }));

        return NextResponse.json(safe);
    } catch (error: any) {
        console.error('GET /api/admin/stock-log error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
