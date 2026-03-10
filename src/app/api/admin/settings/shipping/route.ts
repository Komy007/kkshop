export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function isAdminOrSuperAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

// GET /api/admin/settings/shipping - Return all provinces (admin only)
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const provinces = await prisma.shippingProvince.findMany({
      orderBy: { sortOrder: 'asc' },
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
    console.error('GET /api/admin/settings/shipping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/settings/shipping - Update shipping fee for a province
// Body: { id: number, shippingFee: number }
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
    const { id, shippingFee } = body as { id: number; shippingFee: number };

    if (id === undefined || id === null) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }
    if (shippingFee === undefined || shippingFee === null || shippingFee < 0) {
      return NextResponse.json(
        { error: 'shippingFee must be a non-negative number' },
        { status: 400 }
      );
    }

    const existing = await prisma.shippingProvince.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Province not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.shippingProvince.update({
      where: { id: Number(id) },
      data: { shippingFee },
    });

    return NextResponse.json({
      id: updated.id,
      nameEn: updated.nameEn,
      nameKo: updated.nameKo,
      nameKm: updated.nameKm,
      nameZh: updated.nameZh,
      shippingFee: updated.shippingFee.toString(),
      sortOrder: updated.sortOrder,
    });
  } catch (error) {
    console.error('PATCH /api/admin/settings/shipping error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
