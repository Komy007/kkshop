export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

// GET /api/products/flash-sale?lang=en - Return currently active flash sales (public)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawLang = searchParams.get('lang') ?? 'en';
    const lang = (['en', 'ko', 'km', 'zh'] as const).includes(rawLang as 'en')
      ? rawLang
      : 'en';

    const now = new Date();

    const flashSales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        product: {
          select: {
            id: true,
            priceUsd: true,
            stockQty: true,
            imageUrl: true,
            translations: {
              where: { langCode: lang },
              take: 1,
              select: { name: true },
            },
            images: {
              orderBy: { sortOrder: 'asc' },
              take: 1,
              select: { url: true },
            },
          },
        },
      },
      orderBy: { endAt: 'asc' },
    });

    const result = flashSales.map((fs) => {
      const productImage =
        fs.product.images[0]?.url ?? fs.product.imageUrl ?? null;
      const productName = fs.product.translations[0]?.name ?? '';

      return {
        id: fs.id.toString(),
        productId: fs.productId.toString(),
        productName,
        imageUrl: productImage,
        originalPriceUsd: fs.product.priceUsd.toString(),
        salePriceUsd: fs.salePriceUsd.toString(),
        startAt: fs.startAt.toISOString(),
        endAt: fs.endAt.toISOString(),
        labelEn: fs.labelEn,
        labelKo: fs.labelKo,
        maxQtyPerUser: fs.maxQtyPerUser,
        stockQty: fs.product.stockQty,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/products/flash-sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
