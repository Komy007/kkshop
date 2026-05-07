import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/expire-new
 * Marks products older than 30 days as isNew=false.
 * SECURITY: CRON_SECRET env var is REQUIRED. Requests without a valid
 *           Authorization: Bearer <secret> header are rejected.
 *           GET handler is intentionally removed to prevent secret leaking via URL params.
 */

function verifyCronSecret(req: Request): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        // No secret configured → endpoint is locked down entirely
        console.error('[cron/expire-new] CRON_SECRET is not set — rejecting all requests');
        return false;
    }
    const auth = req.headers.get('authorization');
    return auth === `Bearer ${cronSecret}`;
}

export async function POST(req: Request) {
    if (!verifyCronSecret(req)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const result = await prisma.product.updateMany({
            where: { isNew: true, createdAt: { lt: thirtyDaysAgo } },
            data: { isNew: false },
        });
        return NextResponse.json({ success: true, expired: result.count });
    } catch (error) {
        console.error('[cron/expire-new] error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
