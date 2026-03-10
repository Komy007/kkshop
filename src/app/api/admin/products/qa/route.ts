export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function isAdminOrSuperAdmin(role?: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

// GET /api/admin/products/qa?status=PENDING&productId=xxx
// ADMIN/SUPERADMIN only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdminOrSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING';
    const productIdParam = searchParams.get('productId');

    const where: {
      status: string;
      productId?: bigint;
    } = { status };

    if (productIdParam) {
      where.productId = BigInt(productIdParam);
    }

    const qaItems = await prisma.productQA.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            translations: {
              where: { langCode: 'en' },
              take: 1,
              select: { name: true },
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = qaItems.map((item) => ({
      id: item.id.toString(),
      productId: item.productId.toString(),
      productSku: item.product.sku,
      productName: item.product.translations[0]?.name ?? '',
      userId: item.userId,
      userName: item.user.name,
      userEmail: item.user.email,
      question: item.question,
      answer: item.answer,
      status: item.status,
      isPrivate: item.isPrivate,
      answeredBy: item.answeredBy,
      answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/admin/products/qa error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/qa - Answer or reject a Q&A
// Body: { id: number, action: 'ANSWER' | 'REJECT', answer?: string }
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
    const { id, action, answer } = body as {
      id: number | string;
      action: 'ANSWER' | 'REJECT';
      answer?: string;
    };

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    if (!['ANSWER', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be ANSWER or REJECT' },
        { status: 400 }
      );
    }

    const qaId = BigInt(id);

    const existing = await prisma.productQA.findUnique({
      where: { id: qaId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Q&A not found' }, { status: 404 });
    }

    let updateData: {
      status: string;
      answer?: string;
      answeredBy?: string;
      answeredAt?: Date;
    };

    if (action === 'ANSWER') {
      if (!answer || answer.trim().length === 0) {
        return NextResponse.json(
          { error: 'answer is required when action is ANSWER' },
          { status: 400 }
        );
      }
      updateData = {
        status: 'ANSWERED',
        answer: answer.trim(),
        answeredBy: session.user.email ?? session.user.id,
        answeredAt: new Date(),
      };
    } else {
      updateData = { status: 'REJECTED' };
    }

    const updated = await prisma.productQA.update({
      where: { id: qaId },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id.toString(),
      status: updated.status,
      answer: updated.answer,
      answeredBy: updated.answeredBy,
      answeredAt: updated.answeredAt ? updated.answeredAt.toISOString() : null,
    });
  } catch (error) {
    console.error('PATCH /api/admin/products/qa error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
