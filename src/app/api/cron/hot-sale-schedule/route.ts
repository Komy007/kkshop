import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/hot-sale-schedule
 * Activates/deactivates hot sale products based on hotSaleStartAt / hotSaleEndAt.
 * SECURITY: CRON_SECRET env var is REQUIRED. Requests without a valid
 *           Authorization: Bearer <secret> header are rejected.
 *           GET handler is intentionally removed to prevent secret leaking via URL params.
 */

function verifyCronSecret(req: Request): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        console.error('[cron/hot-sale-schedule] CRON_SECRET is not set — rejecting all requests');
        return false;
    }
    const auth = req.headers.get('authorization');
    return auth === `Bearer ${cronSecret}`;
}

export async function POST(req: Request) {
    if (!verifyCronSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();

        // a. Activate: start time reached, end time not yet passed
        const activated = await prisma.product.updateMany({
            where: {
                isHotSale: false,
                hotSaleStartAt: { lte: now },
                hotSaleEndAt: { gt: now },
            },
            data: { isHotSale: true },
        });

        // b. Deactivate: end time has passed
        const deactivated = await prisma.product.updateMany({
            where: {
                isHotSale: true,
                hotSaleEndAt: { not: null, lte: now },
            },
            data: { isHotSale: false, hotSaleStartAt: null, hotSaleEndAt: null },
        });

        return NextResponse.json({ success: true, activated: activated.count, deactivated: deactivated.count });
    } catch (error) {
        console.error('[cron/hot-sale-schedule] error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
