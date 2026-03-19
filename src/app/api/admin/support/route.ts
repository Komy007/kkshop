import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

function requireAdmin(session: any) {
    const role = session?.user?.role;
    if (!role || !['ADMIN', 'SUPERADMIN'].includes(role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
}

export async function GET(req: NextRequest) {
    const session = await auth();
    const denied  = requireAdmin(session);
    if (denied) return denied;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? '';
    const search = searchParams.get('search') ?? '';

    const where: any = {
        ...(status ? { status } : {}),
        ...(search ? {
            OR: [
                { question: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
        } : {}),
    };

    const [tickets, total] = await Promise.all([
        prisma.productQA.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                // translations를 include로 한 번에 가져와 N+1 쿼리 해소
                product: {
                    select: {
                        imageUrl: true,
                        translations: {
                            where:  { langCode: 'en' },
                            select: { name: true },
                            take: 1,
                        },
                    },
                },
                user: { select: { email: true, name: true } },
            },
        }),
        prisma.productQA.count({ where }),
    ]);

    const enriched = (tickets as any[]).map((t: any) => ({
        ...t,
        product: t.product
            ? { imageUrl: t.product.imageUrl, nameEn: t.product.translations?.[0]?.name ?? '' }
            : null,
    }));

    return NextResponse.json({ tickets: enriched, total });
}

export async function PATCH(req: NextRequest) {
    const session = await auth();
    const denied  = requireAdmin(session);
    if (denied) return denied;

    const { ticketId, answer, status } = await req.json();

    if (!ticketId || !['ANSWERED', 'REJECTED'].includes(status)) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const updated = await prisma.productQA.update({
        where: { id: ticketId },
        data: {
            status,
            answer:     answer ?? null,
            answeredBy: session!.user!.email ?? 'admin',
            answeredAt: new Date(),
        },
    });

    return NextResponse.json({ ticket: updated });
}
