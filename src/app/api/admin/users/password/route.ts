import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req: Request) {
    try {
        // Authenticate User: MUST be SUPERADMIN
        const session = await auth();
        if (!session?.user || session.user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: 'Unauthorized Access. SUPERADMIN required.' }, { status: 403 });
        }

        const body = await req.json();
        const { targetUserId, newPassword } = body;

        if (!targetUserId || !newPassword) {
            return NextResponse.json({ error: 'Missing target user ID or new password.' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the user
        await prisma.user.update({
            where: { id: targetUserId },
            data: { hashedPassword: hashedPassword }
        });

        return NextResponse.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('Failed to change password:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
