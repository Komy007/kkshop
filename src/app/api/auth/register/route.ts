import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/lib/mail';

// In-memory rate limiting (auto-cleanup every 10 minutes to prevent memory leak)
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS_PER_MINUTE = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

// Cleanup stale entries every 10 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, val] of rateLimitCache.entries()) {
            if (now - val.timestamp > RATE_LIMIT_WINDOW_MS * 2) {
                rateLimitCache.delete(key);
            }
        }
    }, 10 * 60 * 1000);
}

function getClientIp(req: Request): string {
    // Trust Cloud Run's forwarded IP (first IP is real client)
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const firstIp = forwarded.split(',')[0].trim();
        // Basic IP validation to prevent spoofing with crafted values
        if (/^[\d.]+$/.test(firstIp) || /^[a-f0-9:]+$/i.test(firstIp)) {
            return firstIp;
        }
    }
    return req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Generates a unique 8-character referral code for a new user.
 * Format: "KK" + 6 random uppercase alphanumeric characters.
 * Retries up to 5 times to guarantee uniqueness.
 */
async function generateUniqueReferralCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let attempt = 0; attempt < 5; attempt++) {
        let suffix = '';
        for (let i = 0; i < 6; i++) {
            suffix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const code = 'KK' + suffix;
        // Check uniqueness in the DB
        const existing = await prisma.user.findUnique({
            where: { referralCode: code },
            select: { id: true }
        });
        if (!existing) return code;
    }
    // Extremely unlikely to reach here, but fallback with timestamp for safety
    return 'KK' + Date.now().toString(36).toUpperCase().slice(-6);
}

export async function POST(req: Request) {
    try {
        // --- 1. Rate Limiting Protection ---
        const ip = getClientIp(req);
        const now = Date.now();

        const clientData = rateLimitCache.get(ip);
        if (clientData) {
            if (now - clientData.timestamp < RATE_LIMIT_WINDOW_MS) {
                if (clientData.count >= MAX_REQUESTS_PER_MINUTE) {
                    return NextResponse.json({ error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
                }
                clientData.count++;
            } else {
                rateLimitCache.set(ip, { count: 1, timestamp: now });
            }
        } else {
            rateLimitCache.set(ip, { count: 1, timestamp: now });
        }

        // --- 2. Input Validation ---
        const body = await req.json();
        const { name, email, password, phone, address, detailAddress, postalCode, referralCode } = body;

        if (!email || !password || !name || !phone) {
            return NextResponse.json({ error: '이름, 이메일, 비밀번호, 전화번호는 필수 항목입니다.' }, { status: 400 });
        }

        if (!address) {
            return NextResponse.json({ error: '주소를 입력해 주세요.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: '비밀번호는 최소 8자리 이상이어야 합니다.' }, { status: 400 });
        }

        // Password complexity: at least 1 letter and 1 number
        if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
            return NextResponse.json({ error: '비밀번호는 영문자와 숫자를 모두 포함해야 합니다.' }, { status: 400 });
        }

        // --- 3. Duplicate Email Check ---
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return NextResponse.json({ error: '이미 가입된 이메일 주소입니다.' }, { status: 409 });
        }

        // --- 4. Validate referral code (if provided) ---
        let referrer: { id: string; pointBalance: number } | null = null;
        const normalizedReferralCode = referralCode ? String(referralCode).trim().toUpperCase() : null;

        if (normalizedReferralCode) {
            referrer = await prisma.user.findUnique({
                where: { referralCode: normalizedReferralCode },
                select: { id: true, pointBalance: true }
            });
            // If referral code provided but not found, we silently ignore it
            // (do not fail registration because of an invalid referral code)
        }

        // --- 5. Generate unique referral code for the new user ---
        const newUserReferralCode = await generateUniqueReferralCode();

        // --- 6. Password Encryption & User Creation ---
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                hashedPassword,
                role: 'USER',
                phone: phone || null,
                address: address || null,
                detailAddress: detailAddress || null,
                postalCode: postalCode || null,
                referralCode: newUserReferralCode,
                referredByCode: referrer ? normalizedReferralCode : null,
            },
        });

        // --- 7. Reward referrer (if valid referral code was used) ---
        if (referrer) {
            const REFERRAL_REWARD_POINTS = 50;
            try {
                await prisma.$transaction(async (tx) => {
                    // Award points to the referrer
                    const updatedReferrer = await tx.user.update({
                        where: { id: referrer!.id },
                        data: { pointBalance: { increment: REFERRAL_REWARD_POINTS } }
                    });

                    // Record the point transaction
                    await tx.userPoint.create({
                        data: {
                            userId: referrer!.id,
                            amount: REFERRAL_REWARD_POINTS,
                            reason: `추천인 가입 보상 (Referral signup: ${newUser.email})`,
                            balanceAfter: updatedReferrer.pointBalance,
                            orderId: null,
                        }
                    });

                    // Create a ReferralReward record
                    await tx.referralReward.create({
                        data: {
                            referrerId: referrer!.id,
                            referredUserId: newUser.id,
                            pointsAwarded: REFERRAL_REWARD_POINTS,
                        }
                    });
                });
            } catch (referralErr) {
                // Referral reward failure is non-critical — user was already created
                console.error('Referral reward failed (non-critical):', referralErr);
            }
        }

        // --- 8. Create email verification token and send verification email ---
        const verifyToken = crypto.randomBytes(32).toString('hex');
        await prisma.emailVerificationToken.create({
            data: {
                userId: newUser.id,
                token: verifyToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            },
        });

        const baseUrl = process.env.NEXTAUTH_URL || 'https://kkshop.cc';
        const verifyUrl = `${baseUrl}/verify-email?token=${verifyToken}`;

        // Non-blocking — email failure must not break registration
        sendVerificationEmail(newUser.email!, newUser.name ?? 'there', verifyUrl).catch(err =>
            console.error('Verification email failed (non-critical):', err)
        );

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                referralCode: newUser.referralCode,
            },
            message: '성공적으로 회원가입 되었습니다.'
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: '회원가입 처리 중 알 수 없는 오류가 발생했습니다.' }, { status: 500 });
    }
}
