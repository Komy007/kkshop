import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

export const dynamic = 'force-dynamic';
// Cache for 60 seconds — redeemRate changes rarely
export const revalidate = 60;

/**
 * GET /api/settings/points-config
 * Returns { redeemRate: number } — how many points equal $1 USD.
 * Default: 1000 (1,000 P = $1).
 */
export async function GET() {
    try {
        const setting = await prisma.siteSetting.findUnique({ where: { key: 'points_config' } });
        const config = setting?.value as any;
        const redeemRate: number =
            typeof config?.redeemRate === 'number' && config.redeemRate > 0
                ? config.redeemRate
                : 1000;
        return NextResponse.json({ redeemRate }, {
            headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
        });
    } catch {
        return NextResponse.json({ redeemRate: 1000 });
    }
}
