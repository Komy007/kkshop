import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

let _cache: { data: any[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export const dynamic = 'force-dynamic';

export async function GET() {
    const now = Date.now();
    if (_cache && now - _cache.ts < CACHE_TTL) {
        return NextResponse.json(_cache.data, {
            headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
        });
    }

    const since = new Date(now - 72 * 60 * 60 * 1000);

    try {
        const recentOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: since },
                status: { notIn: ['CANCELLED', 'REFUNDED'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 8,
            select: {
                customerName: true,
                province: true,
                createdAt: true,
                items: {
                    take: 1,
                    select: {
                        product: {
                            select: {
                                translations: {
                                    where: { langCode: 'en' },
                                    select: { name: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });

        const result = recentOrders
            .filter(o => o.items.length > 0)
            .map(o => {
                const name = (o.customerName ?? '').trim();
                const masked =
                    name.length <= 2
                        ? (name[0] ?? '?') + '***'
                        : name[0] + '***' + name[name.length - 1];
                const productName =
                    o.items[0]?.product?.translations[0]?.name ?? 'Korean Product';
                const minutesAgo = Math.max(1, Math.floor((now - o.createdAt.getTime()) / 60_000));
                return {
                    maskedName: masked,
                    province: o.province ?? 'Phnom Penh',
                    productName,
                    minutesAgo,
                };
            });

        _cache = { data: result, ts: now };
        return NextResponse.json(result, {
            headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
        });
    } catch {
        return NextResponse.json([]);
    }
}
