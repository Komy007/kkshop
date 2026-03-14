import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }
    if (newPassword.length < 8) {
        return NextResponse.json({ error: 'password_too_short' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || !user.hashedPassword) {
        return NextResponse.json({ error: 'no_password' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isMatch) {
        return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } });
    return NextResponse.json({ success: true });
}
