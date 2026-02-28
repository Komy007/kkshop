import { NextResponse } from 'next/server';
import { prisma } from '@/lib/api';
import bcrypt from 'bcryptjs';

// Simple in-memory rate limiting to prevent spam
const rateLimitCache = new Map<string, { count: number; timestamp: number }>();
const MAX_REQUESTS_PER_MINUTE = 5;

export async function POST(req: Request) {
    try {
        // --- 1. Rate Limiting Protection ---
        // We use the forwarded IP if available, fallback to a general bucket.
        const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute

        const clientData = rateLimitCache.get(ip);
        if (clientData) {
            if (now - clientData.timestamp < windowMs) {
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
        const { name, email, password, phone, address, detailAddress, postalCode } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ error: '이름, 이메일, 비밀번호는 필수 항목입니다.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: '비밀번호는 최소 6자리 이상이어야 합니다.' }, { status: 400 });
        }

        // --- 3. Duplicate Email Check ---
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            // To prevent email enumeration, we return generic user error, but for signup UX, specific error is fine.
            return NextResponse.json({ error: '이미 가입된 이메일 주소입니다.' }, { status: 409 });
        }

        // --- 4. Password Encryption & User Creation ---
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
            },
        });

        return NextResponse.json({
            success: true,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
            },
            message: '성공적으로 회원가입 되었습니다.'
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: '회원가입 처리 중 알 수 없는 오류가 발생했습니다.' }, { status: 500 });
    }
}
