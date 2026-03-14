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
                product: { select: { imageUrl: true } },
                user:    { select: { email: true, name: true } },
            },
        }),
        prisma.productQA.count({ where }),
    ]);

    // Fetch product names from translations
    const enriched = await Promise.all(
        (tickets as any[]).map(async (t: any) => {
            let nameEn = '';
            if (t.productId) {
                const trans = await prisma.productTranslation.findFirst({
                    where:  { productId: t.productId, langCode: 'en' },
                    select: { name: true },
                });
                nameEn = (trans as any)?.name ?? '';
            }
            return {
                ...t,
                product: t.product ? { ...t.product, nameEn } : null,
            };
        })
    );

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
