export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

// GET /api/user/addresses - Return all saved addresses for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(addresses);
  } catch (error) {
    console.error('GET /api/user/addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/user/addresses - Create a new address
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      label,
      recipientName,
      phone,
      province,
      address,
      detailAddress,
      isDefault,
    } = body as {
      label: string;
      recipientName: string;
      phone: string;
      province: string;
      address: string;
      detailAddress?: string;
      isDefault?: boolean;
    };

    if (!label || !recipientName || !phone || !province || !address) {
      return NextResponse.json(
        { error: 'label, recipientName, phone, province, and address are required' },
        { status: 400 }
      );
    }

    // If this will be the default, clear other defaults first
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const created = await prisma.userAddress.create({
      data: {
        userId: session.user.id,
        label,
        recipientName,
        phone,
        province,
        address,
        detailAddress: detailAddress ?? null,
        isDefault: isDefault ?? false,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST /api/user/addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/user/addresses - Update an existing address (body must include id)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, isDefault, ...fields } = body as {
      id: string;
      label?: string;
      recipientName?: string;
      phone?: string;
      province?: string;
      address?: string;
      detailAddress?: string;
      isDefault?: boolean;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'id is required in request body' },
        { status: 400 }
      );
    }

    // Ensure the address belongs to the authenticated user
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If setting as default, clear all other defaults first
    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.userAddress.update({
      where: { id },
      data: {
        ...fields,
        ...(isDefault !== undefined ? { isDefault } : {}),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH /api/user/addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/addresses?id=xxx - Delete an address
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id query parameter is required' },
        { status: 400 }
      );
    }

    // Ensure the address belongs to the authenticated user
    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.userAddress.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/user/addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
