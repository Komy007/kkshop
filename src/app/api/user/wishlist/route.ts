export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

// GET /api/user/wishlist - Return user's wishlist items with product data
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = items.map((item) => {
      const translation = item.product.translations[0];
      const image = item.product.images[0];
      return {
        wishlistId: item.id,
        productId: item.productId.toString(),
        name: translation?.name ?? '',
        imageUrl: image?.url ?? item.product.imageUrl ?? null,
        priceUsd: item.product.priceUsd.toString(),
        stockQty: item.product.stockQty,
        isHotSale: item.product.isHotSale,
        hotSalePrice: item.product.hotSalePrice
          ? item.product.hotSalePrice.toString()
          : null,
        addedAt: item.createdAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/user/wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/wishlist - Toggle wishlist item (add or remove)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { productId } = body as { productId: string };

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const productIdBig = BigInt(productId);

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: productIdBig,
        },
      },
    });

    if (existing) {
      await prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ added: false });
    } else {
      await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          productId: productIdBig,
        },
      });
      return NextResponse.json({ added: true });
    }
  } catch (error) {
    console.error('POST /api/user/wishlist error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
