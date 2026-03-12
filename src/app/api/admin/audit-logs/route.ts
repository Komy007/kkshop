export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/api';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '30'));
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';

    const where: any = {};
    if (search) {
        where.OR = [
            { userEmail: { contains: search, mode: 'insensitive' } },
            { resource: { contains: search, mode: 'insensitive' } },
            { resourceId: { contains: search, mode: 'insensitive' } },
        ];
    }
    if (action) where.action = action;

    const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: (page - 1) * limit,
        }),
        prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total });
}
