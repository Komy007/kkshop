import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || !['ADMIN', 'SUPERADMIN'].includes(session.user.role ?? '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: '현재 비밀번호와 새 비밀번호를 입력하세요.' }, { status: 400 });
    }
    if (newPassword.length < 8) {
        return NextResponse.json({ error: '새 비밀번호는 최소 8자 이상이어야 합니다.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email! } });
    if (!user || !user.hashedPassword) {
        return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
        return NextResponse.json({ error: '현재 비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } });
    return NextResponse.json({ success: true });
}
