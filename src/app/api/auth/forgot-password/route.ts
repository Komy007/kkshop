import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import { sendPasswordResetEmail } from '@/lib/mail';
import crypto from 'crypto';

// Rate limiting: max 3 requests per 10 minutes per IP
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
    try {
        const forwarded = req.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : (req.headers.get('x-real-ip') || 'unknown');
        const now = Date.now();
        const windowMs = 10 * 60 * 1000;

        const existing = rateLimitCache.get(ip);
        if (existing && now - existing.timestamp < windowMs) {
            if (existing.count >= 3) {
                return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
            }
            existing.count++;
        } else {
            rateLimitCache.set(ip, { count: 1, timestamp: now });
        }

        const { email } = await req.json();
        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase().trim() },
            select: { id: true, email: true },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true });
        }

        // Invalidate existing unused tokens for this user
        await prisma.passwordResetToken.updateMany({
            where: { userId: user.id, used: false },
            data: { used: true },
        });

        // Create new token (expires in 1 hour) — store SHA-256 hash only
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: tokenHash,
                expiresAt: new Date(Date.now() + 60 * 60 * 1000),
            },
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
        const resetUrl = `${baseUrl}/reset-password?token=${token}`;

        try {
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (mailErr) {
            console.error('Password reset email failed:', mailErr);
            // Don't expose mail errors to the client
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
    }
}
