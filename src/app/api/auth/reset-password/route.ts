import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
        }

        const record = await prisma.passwordResetToken.findUnique({
            where: { token },
            include: { user: { select: { id: true } } },
        });

        if (!record || record.used || record.expiresAt < new Date()) {
            return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.userId },
                data: { hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: record.id },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
