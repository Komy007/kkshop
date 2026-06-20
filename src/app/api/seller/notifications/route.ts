import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';

export const dynamic = 'force-dynamic';

// GET /api/seller/notifications — 최근 알림 20건 + 미읽음 수
export async function GET() {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SUPPLIER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ notifications: [], unreadCount: 0 });

    const [notifications, unreadCount] = await Promise.all([
        prisma.sellerNotification.findMany({
            where:   { supplierId: supplier.id },
            orderBy: { createdAt: 'desc' },
            take:    20,
        }),
        prisma.sellerNotification.count({
            where: { supplierId: supplier.id, isRead: false },
        }),
    ]);

    return NextResponse.json({
        notifications: (notifications as any[]).map((n: any) => ({
            ...n,
            amountUsd: Number(n.amountUsd),
        })),
        unreadCount,
    });
}

// PATCH /api/seller/notifications — 읽음 처리 { ids?: string[], all?: boolean }
export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'SUPPLIER') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({ where: { userId: session.user.id } });
    if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 404 });

    const body = await req.json() as { ids?: string[]; all?: boolean };

    if (body.all) {
        // 반드시 본인 supplier 소유만 업데이트 (보안)
        await prisma.sellerNotification.updateMany({
            where: { supplierId: supplier.id },
            data:  { isRead: true },
        });
    } else if (body.ids?.length) {
        await prisma.sellerNotification.updateMany({
            where: { supplierId: supplier.id, id: { in: body.ids } },
            data:  { isRead: true },
        });
    }

    return NextResponse.json({ success: true });
}
