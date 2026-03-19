import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

// ── GET: list users with pagination + search ──────────────────────────────────
export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const search = searchParams.get('search')?.trim() || '';

    const where = search
        ? {
            OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { email: { contains: search, mode: 'insensitive' as const } },
            ],
        }
        : {};

    const [customers, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true, name: true, email: true, role: true,
                phone: true, createdAt: true,
                _count: { select: { orders: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.user.count({ where }),
    ]);

    return NextResponse.json({ customers, total, page, pageSize: PAGE_SIZE });
}

// ── PATCH: update role OR reset password ─────────────────────────────────────
// role 변경은 SUPERADMIN 전용 — ADMIN이 SUPERADMIN 역할을 부여하는 권한 상승 차단
const ALLOWED_ROLES = ['USER', 'ADMIN', 'SUPPLIER'] as const;

export async function PATCH(req: Request) {
    const session = await auth();
    const callerRole = session?.user?.role ?? '';
    if (!['ADMIN', 'SUPERADMIN'].includes(callerRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const { id, role, newPassword } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    // 자기 자신 역할 변경 차단
    if (role && id === session!.user!.id) {
        return NextResponse.json({ error: '자신의 역할은 변경할 수 없습니다.' }, { status: 400 });
    }

    const data: any = {};

    if (role) {
        // SUPERADMIN 역할 부여는 SUPERADMIN만 가능
        if (callerRole !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'SUPERADMIN 역할 변경은 SUPERADMIN만 가능합니다.' }, { status: 403 });
        }
        // 허용된 역할 화이트리스트 검증 (SUPERADMIN은 부여 가능하지만 자신에게만)
        const allRoles = [...ALLOWED_ROLES, 'SUPERADMIN'] as string[];
        if (!allRoles.includes(role)) {
            return NextResponse.json({ error: `허용되지 않은 역할입니다: ${role}` }, { status: 400 });
        }
        data.role = role;
    }

    if (newPassword) {
        if (newPassword.length < 8) return NextResponse.json({ error: '비밀번호는 최소 8자 이상' }, { status: 400 });
        data.hashedPassword = await bcrypt.hash(newPassword, 12);
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
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

    if (session.user.id === id) return NextResponse.json({ error: '자신은 삭제할 수 없습니다' }, { status: 400 });

    // 삭제 대상의 역할 확인 — 상위 역할 삭제 방지
    const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const callerRole = session.user.role ?? '';
    // SUPERADMIN 계정은 어떤 경우에도 삭제 불가
    if (targetUser.role === 'SUPERADMIN') {
        return NextResponse.json({ error: 'SUPERADMIN 계정은 삭제할 수 없습니다.' }, { status: 403 });
    }
    // ADMIN은 USER/SUPPLIER만 삭제 가능 (동급 ADMIN 삭제 차단)
    if (callerRole === 'ADMIN' && !['USER', 'SUPPLIER'].includes(targetUser.role)) {
        return NextResponse.json({ error: 'ADMIN은 일반 사용자/공급자만 삭제할 수 있습니다.' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
