import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

type Section = 'hot' | 'new' | 'popular' | 'todaypick';

// ── GET: list products for a homepage section ─────────────────────────────────
export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const section = (searchParams.get('section') || 'hot') as Section;

        const baseWhere = { status: 'ACTIVE', approvalStatus: 'APPROVED' };

        let where: any = baseWhere;
        let orderBy: any = [{ displayPriority: 'desc' }, { createdAt: 'desc' }];
        let take: number | undefined = undefined;

        switch (section) {
            case 'hot':
                where = { ...baseWhere, isHotSale: true };
                break;
            case 'new':
                where = { ...baseWhere };
                orderBy = [{ createdAt: 'desc' }];
                take = 20;
                break;
            case 'popular':
                where = { ...baseWhere };
                orderBy = [{ reviewAvg: 'desc' }, { reviewCount: 'desc' }];
                take = 20;
                break;
            case 'todaypick':
                where = { ...baseWhere, isTodayPick: true };
                break;
            default:
                return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
        }

        const products = await prisma.product.findMany({
            where,
            orderBy,
            take,
            include: {
                translations: {
                    where: { langCode: 'ko' },
                    select: { name: true },
                },
                images: {
                    orderBy: { sortOrder: 'asc' },
                    take: 1,
                    select: { url: true },
                },
            },
        });

        const safe = products.map((p) => ({
            id: p.id.toString(),
            name: p.translations[0]?.name ?? `Product ${p.id}`,
            priceUsd: p.priceUsd.toString(),
            hotSalePrice: p.hotSalePrice?.toString() ?? null,
            displayPriority: p.displayPriority,
            isHotSale: p.isHotSale,
            isNew: p.isNew,
            isTodayPick: p.isTodayPick,
            reviewAvg: p.reviewAvg.toString(),
            reviewCount: p.reviewCount,
            imageUrl: p.images[0]?.url ?? p.imageUrl ?? null,
        }));

        return NextResponse.json({ products: safe });
    } catch (error: any) {
        console.error('GET /api/admin/homepage-sections error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
