export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';

// GET /api/settings/provinces - Public endpoint, returns all shipping provinces
export async function GET() {
  try {
    const provinces = await prisma.shippingProvince.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        nameEn: true,
        nameKo: true,
        nameKm: true,
        nameZh: true,
        shippingFee: true,
        sortOrder: true,
      },
    });

    const result = provinces.map((p) => ({
      id: p.id,
      nameEn: p.nameEn,
      nameKo: p.nameKo,
      nameKm: p.nameKm,
      nameZh: p.nameZh,
      shippingFee: p.shippingFee.toString(),
      sortOrder: p.sortOrder,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/settings/provinces error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
