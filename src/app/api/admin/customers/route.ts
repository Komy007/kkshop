import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// ── GET: list all users ──────────────────────────────────────────────────────
export async function GET() {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const customers = await prisma.user.findMany({
        select: {
            id: true, name: true, email: true, role: true,
            phone: true, createdAt: true,
            _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(customers);
}

// ── PATCH: update role OR reset password ─────────────────────────────────────
export async function PATCH(req: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await req.json();
    const { id, role, newPassword } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const data: any = {};
    if (role) data.role = role;
    if (newPassword) {
        if (newPassword.length < 8) return NextResponse.json({ error: '비밀번호는 최소 8자 이상' }, { status: 400 });
        data.hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true });
}

// ── DELETE: remove user ──────────────────────────────────────────────────────
export async function DELETE(req: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // Prevent self-deletion
    if (session.user.id === id) return NextResponse.json({ error: '자신은 삭제할 수 없습니다' }, { status: 400 });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
