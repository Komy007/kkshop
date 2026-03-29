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

        const hashedPassword = await bcrypt.hash(password, 12);

        // Atomic: claim the token first with conditional update to prevent race conditions
        const claimed = await prisma.passwordResetToken.updateMany({
            where: { token, used: false, expiresAt: { gt: new Date() } },
            data: { used: true },
        });

        if (claimed.count === 0) {
            return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
        }

        // Token is now claimed — find the userId and update password
        const record = await prisma.passwordResetToken.findUnique({
            where: { token },
            select: { userId: true },
        });

        if (!record) {
            return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: record.userId },
            data: { hashedPassword },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
