import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// GET /api/auth/verify-email?token=xxx
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 });
        }

        const record = await prisma.emailVerificationToken.findUnique({
            where: { token },
            include: { user: { select: { id: true, email: true, emailVerified: true } } },
        });

        if (!record) {
            return NextResponse.json({ error: 'Invalid or already-used token.' }, { status: 400 });
        }

        if (record.used) {
            return NextResponse.json({ error: 'This link has already been used.' }, { status: 400 });
        }

        if (record.expiresAt < new Date()) {
            return NextResponse.json({ error: 'This verification link has expired. Please request a new one.' }, { status: 400 });
        }

        // Already verified
        if (record.user.emailVerified) {
            await prisma.emailVerificationToken.update({ where: { token }, data: { used: true } });
            return NextResponse.json({ success: true, alreadyVerified: true });
        }

        // Mark email as verified + mark token as used
        await prisma.$transaction([
            prisma.user.update({
                where: { id: record.userId },
                data: { emailVerified: new Date() },
            }),
            prisma.emailVerificationToken.update({
                where: { token },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('verify-email error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}

// POST /api/auth/verify-email — resend verification email
export async function POST(req: Request) {
    try {
        // Rate limiting: IP당 1시간에 최대 3회 재발송
        const ip = getClientIp(req);
        const { allowed } = checkRateLimit(ip, 'verify-resend', 3, 60 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        const { email } = await req.json();
        if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            select: { id: true, name: true, email: true, emailVerified: true },
        });

        // Always return success to prevent email enumeration
        if (!user || user.emailVerified) {
            return NextResponse.json({ success: true });
        }

        // Invalidate old tokens
        await prisma.emailVerificationToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        const crypto = await import('crypto');
        const { sendVerificationEmail } = await import('@/lib/mail');

        const verifyToken = crypto.randomBytes(32).toString('hex');
        await prisma.emailVerificationToken.create({
            data: {
                userId: user.id,
                token: verifyToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
        const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;

        sendVerificationEmail(user.email!, user.name ?? 'there', verifyUrl).catch(err =>
            console.error('Resend verification email failed:', err)
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('resend-verification error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
