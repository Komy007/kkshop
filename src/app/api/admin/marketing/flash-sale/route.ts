export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function isAdminOrSuperAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

function serializeFlashSale(fs: {
  id: bigint;
  productId: bigint;
  salePriceUsd: { toString(): string };
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  labelKo: string | null;
  labelEn: string | null;
  maxQtyPerUser: number | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: bigint;
    priceUsd: { toString(): string };
    stockQty: number;
    imageUrl: string | null;
    translations: { name: string }[];
    images: { url: string }[];
  };
}) {
  return {
    id: fs.id.toString(),
    productId: fs.productId.toString(),
    productName: fs.product.translations[0]?.name ?? '',
    imageUrl: fs.product.images[0]?.url ?? fs.product.imageUrl ?? null,
    originalPriceUsd: fs.product.priceUsd.toString(),
    salePriceUsd: fs.salePriceUsd.toString(),
    startAt: fs.startAt.toISOString(),
    endAt: fs.endAt.toISOString(),
    isActive: fs.isActive,
    labelKo: fs.labelKo,
    labelEn: fs.labelEn,
    maxQtyPerUser: fs.maxQtyPerUser,
    stockQty: fs.product.stockQty,
    createdAt: fs.createdAt.toISOString(),
    updatedAt: fs.updatedAt.toISOString(),
  };
}

const productInclude = {
  product: {
    select: {
      id: true,
      priceUsd: true,
      stockQty: true,
      imageUrl: true,
      translations: {
        where: { langCode: 'en' },
        take: 1,
        select: { name: true },
      },
      images: {
        orderBy: { sortOrder: 'asc' as const },
        take: 1,
        select: { url: true },
      },
    },
  },
};

// GET /api/admin/marketing/flash-sale - Return all flash sales
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const flashSales = await prisma.flashSale.findMany({
      include: productInclude,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(flashSales.map(serializeFlashSale));
  } catch (error) {
    console.error('GET /api/admin/marketing/flash-sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/marketing/flash-sale - Create a new flash sale
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      productId,
      salePriceUsd,
      startAt,
      endAt,
      isActive,
      labelKo,
      labelEn,
      maxQtyPerUser,
    } = body as {
      productId: string | number;
      salePriceUsd: number | string;
      startAt: string;
      endAt: string;
      isActive?: boolean;
      labelKo?: string;
      labelEn?: string;
      maxQtyPerUser?: number;
    };

    if (!productId || !salePriceUsd || !startAt || !endAt) {
      return NextResponse.json(
        { error: 'productId, salePriceUsd, startAt, and endAt are required' },
        { status: 400 }
      );
    }

    if (new Date(startAt) >= new Date(endAt)) {
      return NextResponse.json(
        { error: '종료 시각은 시작 시각보다 나중이어야 합니다.' },
        { status: 400 }
      );
    }

    if (Number(salePriceUsd) <= 0) {
      return NextResponse.json(
        { error: '세일 가격은 0보다 커야 합니다.' },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: BigInt(productId) },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const created = await prisma.flashSale.create({
      data: {
        productId: BigInt(productId),
        salePriceUsd: Number(salePriceUsd),
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        isActive: isActive ?? true,
        labelKo: labelKo ?? null,
        labelEn: labelEn ?? null,
        maxQtyPerUser: maxQtyPerUser ?? null,
      },
      include: productInclude,
    });

    return NextResponse.json(serializeFlashSale(created), { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/marketing/flash-sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/marketing/flash-sale - Update a flash sale
// Body: { id, ...fields }
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      id,
      salePriceUsd,
      startAt,
      endAt,
      isActive,
      labelKo,
      labelEn,
      maxQtyPerUser,
    } = body as {
      id: string | number;
      salePriceUsd?: number | string;
      startAt?: string;
      endAt?: string;
      isActive?: boolean;
      labelKo?: string;
      labelEn?: string;
      maxQtyPerUser?: number | null;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const flashSaleId = BigInt(id);

    const existing = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Flash sale not found' },
        { status: 404 }
      );
    }

    // Date validation when both dates provided or when updating one
    const resolvedStart = startAt ? new Date(startAt) : existing.startAt;
    const resolvedEnd = endAt ? new Date(endAt) : existing.endAt;
    if (resolvedStart >= resolvedEnd) {
      return NextResponse.json(
        { error: '종료 시각은 시작 시각보다 나중이어야 합니다.' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (salePriceUsd !== undefined) {
      if (Number(salePriceUsd) <= 0) {
        return NextResponse.json({ error: '세일 가격은 0보다 커야 합니다.' }, { status: 400 });
      }
      updateData.salePriceUsd = Number(salePriceUsd);
    }
    if (startAt !== undefined) updateData.startAt = new Date(startAt);
    if (endAt !== undefined) updateData.endAt = new Date(endAt);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (labelKo !== undefined) updateData.labelKo = labelKo;
    if (labelEn !== undefined) updateData.labelEn = labelEn;
    if (maxQtyPerUser !== undefined) updateData.maxQtyPerUser = maxQtyPerUser;

    const updated = await prisma.flashSale.update({
      where: { id: flashSaleId },
      data: updateData,
      include: productInclude,
    });

    return NextResponse.json(serializeFlashSale(updated));
  } catch (error) {
    console.error('PATCH /api/admin/marketing/flash-sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/marketing/flash-sale?id=xxx - Delete a flash sale
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    const flashSaleId = BigInt(idParam);

    const existing = await prisma.flashSale.findUnique({
      where: { id: flashSaleId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Flash sale not found' },
        { status: 404 }
      );
    }

    await prisma.flashSale.delete({ where: { id: flashSaleId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/marketing/flash-sale error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
