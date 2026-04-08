import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';

/**
 * POST /api/cron/expire-new
 * Marks products older than 30 days as isNew=false.
 * Call daily via Cloud Scheduler or any cron service.
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const result = await prisma.product.updateMany({
            where: { isNew: true, createdAt: { lt: thirtyDaysAgo } },
            data: { isNew: false },
        });
        return NextResponse.json({ success: true, expired: result.count });
    } catch (error) {
        console.error('expire-new cron error:', error);
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

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const result = await prisma.product.updateMany({
            where: { isNew: true, createdAt: { lt: thirtyDaysAgo } },
            data: { isNew: false },
        });
        return NextResponse.json({ success: true, expired: result.count });
    } catch (error) {
        console.error('expire-new cron error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
