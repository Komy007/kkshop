import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/hot-sale-schedule
 * Activates/deactivates hot sale products based on hotSaleStartAt / hotSaleEndAt.
 * Call periodically (e.g. every 15 minutes) via Cloud Scheduler or any cron service.
 * Secured by CRON_SECRET env variable (set Authorization: Bearer <secret>).
 */
export async function POST(req: Request) {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization');
        if (auth !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    }

    try {
        const now = new Date();

        // a. Activate: isHotSale=false AND hotSaleStartAt <= now AND hotSaleEndAt > now
        const activated = await prisma.product.updateMany({
            where: {
                isHotSale: false,
                hotSaleStartAt: { lte: now },
                hotSaleEndAt: { gt: now },
            },
            data: { isHotSale: true },
        });

        // b. Deactivate: isHotSale=true AND hotSaleEndAt IS NOT NULL AND hotSaleEndAt <= now
        const deactivated = await prisma.product.updateMany({
            where: {
                isHotSale: true,
                hotSaleEndAt: { not: null, lte: now },
            },
            data: { isHotSale: false, hotSaleStartAt: null, hotSaleEndAt: null },
        });

        return NextResponse.json({ success: true, activated: activated.count, deactivated: deactivated.count });
    } catch (error) {
        console.error('hot-sale-schedule cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// Also allow GET for easy manual trigger from browser (admin only)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && key !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        // a. Activate: isHotSale=false AND hotSaleStartAt <= now AND hotSaleEndAt > now
        const activated = await prisma.product.updateMany({
            where: {
                isHotSale: false,
                hotSaleStartAt: { lte: now },
                hotSaleEndAt: { gt: now },
            },
            data: { isHotSale: true },
        });

        // b. Deactivate: isHotSale=true AND hotSaleEndAt IS NOT NULL AND hotSaleEndAt <= now
        const deactivated = await prisma.product.updateMany({
            where: {
                isHotSale: true,
                hotSaleEndAt: { not: null, lte: now },
            },
            data: { isHotSale: false, hotSaleStartAt: null, hotSaleEndAt: null },
        });

        return NextResponse.json({ success: true, activated: activated.count, deactivated: deactivated.count });
    } catch (error) {
        console.error('hot-sale-schedule cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
