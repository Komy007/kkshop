import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';

/** HTML-escape to prevent XSS in email templates */
function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

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

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update the user and fetch email + supplier info for notification
        const updatedUser = await prisma.user.update({
            where: { id: targetUserId },
            data: { hashedPassword: hashedPassword },
            select: { email: true, name: true },
        });

        // 해당 유저의 Supplier 정보 조회 (이메일 알림용)
        const supplier = await prisma.supplier.findUnique({
            where: { userId: targetUserId },
            select: { contactEmail: true, companyName: true },
        });

        // 비밀번호 리셋 알림 이메일 (non-blocking)
        const notifyEmail = supplier?.contactEmail || updatedUser.email;
        const notifyName = supplier?.companyName || updatedUser.name || 'Seller';
        if (notifyEmail) {
            import('@/lib/mail').then(({ sendEmail }) =>
                sendEmail({
                    to: notifyEmail,
                    subject: 'KKShop - Your password has been reset',
                    html: `
                        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                            <h2 style="color:#1a1a1a;margin-bottom:16px;">Password Reset Notification</h2>
                            <p>Hello <strong>${esc(notifyName)}</strong>,</p>
                            <p style="color:#374151;">Your KKShop seller account password has been reset by an administrator.</p>
                            <p style="color:#374151;">Please log in and change your password to one you prefer.</p>
                            <p style="margin-top:8px;color:#dc2626;font-size:14px;">If you did not request this change, please contact support immediately.</p>
                            <p style="margin-top:24px;color:#9ca3af;font-size:13px;">— KKShop Team</p>
                        </div>
                    `,
                })
            ).catch(err => console.error('[Password Reset] Email notification failed (non-critical):', err));
        }

        return NextResponse.json({ success: true, message: '비밀번호가 성공적으로 변경되었습니다.' });

    } catch (error) {
        console.error('Failed to change password:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
