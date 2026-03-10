export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

// GET /api/products/[id]/qa - Get answered Q&As for a product (public)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = BigInt(id);

    const qaItems = await prisma.productQA.findMany({
      where: {
        productId,
        status: 'ANSWERED',
        isPrivate: false,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        question: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
      },
    });

    const result = qaItems.map((item) => ({
      id: item.id.toString(),
      question: item.question,
      answer: item.answer,
      answeredAt: item.answeredAt ? item.answeredAt.toISOString() : null,
      createdAt: item.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/products/[id]/qa error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/products/[id]/qa - Submit a question (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const productId = BigInt(id);

    const body = await req.json();
    const { question, isPrivate } = body as {
      question: string;
      isPrivate?: boolean;
    };

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'question is required' },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const qa = await prisma.productQA.create({
      data: {
        productId,
        userId: session.user.id,
        question: question.trim(),
        status: 'PENDING',
        isPrivate: isPrivate ?? false,
      },
    });

    return NextResponse.json(
      {
        id: qa.id.toString(),
        productId: qa.productId.toString(),
        question: qa.question,
        status: qa.status,
        isPrivate: qa.isPrivate,
        createdAt: qa.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/products/[id]/qa error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
