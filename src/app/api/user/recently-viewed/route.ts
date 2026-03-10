export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

// GET /api/user/recently-viewed?ids=1,2,3
// No auth required - IDs come from localStorage on client
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json([]);
    }

    const rawIds = idsParam
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (rawIds.length === 0) {
      return NextResponse.json([]);
    }

    // Parse valid BigInts, skip invalid ones
    const validPairs: { original: string; bigInt: bigint }[] = [];
    for (const raw of rawIds) {
      try {
        validPairs.push({ original: raw, bigInt: BigInt(raw) });
      } catch {
        // skip non-numeric ids
      }
    }

    if (validPairs.length === 0) {
      return NextResponse.json([]);
    }

    const bigIntIds = validPairs.map((p) => p.bigInt);

    const products = await prisma.product.findMany({
      where: {
        id: { in: bigIntIds },
        status: 'ACTIVE',
      },
      include: {
        translations: {
          where: { langCode: 'en' },
          take: 1,
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
        },
      },
    });

    // Build a map for ordering
    const productMap = new Map<string, (typeof products)[number]>();
    for (const p of products) {
      productMap.set(p.id.toString(), p);
    }

    // Return in same order as requested IDs, skipping missing/inactive
    const ordered = rawIds
      .map((id) => productMap.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    const result = ordered.map((p) => {
      const translation = p.translations[0];
      const image = p.images[0];
      return {
        id: p.id.toString(),
        name: translation?.name ?? '',
        imageUrl: image?.url ?? p.imageUrl ?? null,
        priceUsd: p.priceUsd.toString(),
        stockQty: p.stockQty,
        isHotSale: p.isHotSale,
        hotSalePrice: p.hotSalePrice ? p.hotSalePrice.toString() : null,
        reviewAvg: p.reviewAvg.toString(),
        reviewCount: p.reviewCount,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/user/recently-viewed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
