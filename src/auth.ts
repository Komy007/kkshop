import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/api"
import bcrypt from "bcryptjs"
import authConfig from "./auth.config"
import { twoFactorCache } from "@/lib/twoFactorCache"

// Login rate limiting: max 10 attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>();
const LOGIN_MAX = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAP_MAX_SIZE = 50_000; // OOM 방지 — DDoS 시 무제한 증가 차단

setInterval(() => {
    const now = Date.now();
    for (const [key, val] of loginAttempts.entries()) {
        if (now - val.firstAttempt > LOGIN_WINDOW_MS * 2) loginAttempts.delete(key);
    }
}, 10 * 60 * 1000);

function checkLoginRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = loginAttempts.get(ip);
    if (!entry || now - entry.firstAttempt > LOGIN_WINDOW_MS) {
        // 크기 상한 초과 시 가장 오래된 엔트리 제거
        if (loginAttempts.size >= LOGIN_MAP_MAX_SIZE) {
            const firstKey = loginAttempts.keys().next().value;
            if (firstKey !== undefined) loginAttempts.delete(firstKey);
        }
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return true;
    }
    if (entry.count >= LOGIN_MAX) return false;
    entry.count++;
    return true;
}

const nextAuthEnv = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    providers: [
        // Only enable Google OAuth if both credentials are present
        // (prevents NextAuth "Configuration" error if secrets are missing)
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [GoogleProvider({
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                authorization: {
                    params: {
                        prompt: "consent",
                        access_type: "offline",
                        response_type: "code"
                    }
                }
            })]
            : []
        ),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) return null

                // Rate limiting by IP
                const forwarded = (req as any)?.headers?.['x-forwarded-for'];
                const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : '').trim() || 'unknown';
                if (!checkLoginRateLimit(ip)) {
                    throw new Error('Too many login attempts. Please wait 15 minutes.');
                }

                // Normalize email to lowercase to avoid case-sensitivity issues
                const email = (credentials.email as string).toLowerCase().trim();

                const user = await prisma.user.findUnique({
                    where: { email },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        hashedPassword: true,
                        role: true,
                        preferredLanguage: true,
                        phone: true,
                        emailVerified: true,
                        twoFactorEnabled: true,
                        twoFactorSecret: true,
                    },
                })

                // hashedPassword is null for OAuth-only accounts — skip them
                if (!user || !user.hashedPassword) return null

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.hashedPassword
                )

                if (passwordsMatch) {
                    // 이메일 인증 완료 여부 확인 — 미인증 시 로그인 차단
                    if (!user.emailVerified) {
                        throw new Error('Please verify your email before logging in.');
                    }
                    return user
                }
                return null
            }
        }),
        // 2FA 검증은 /api/admin/2fa/verify API + session.update() 경로로 처리
        // (별도 CredentialsProvider 불필요 — userId만으로 로그인 가능한 보안 취약점이었으므로 제거)
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            // For OAuth providers, ensure the user exists in our DB
            // NextAuth v5 handles Account linking automatically via the Account model
            // but we need to make sure the user record has the right role set
            if (account?.provider === 'google') {
                // Reject Google accounts with unverified emails
                if (!(profile as any)?.email_verified) {
                    return false;
                }
                if (!user?.email) return false;
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email.toLowerCase() }
                    });
                    if (!existingUser) {
                        // Create a new user record for first-time Google sign-in
                        await prisma.user.create({
                            data: {
                                email: user.email.toLowerCase(),
                                name: user.name ?? null,
                                image: user.image ?? null,
                                role: 'USER',
                                emailVerified: new Date(),
                            }
                        });
                    } else if (!existingUser.image && user.image) {
                        // Update profile image if not set
                        await prisma.user.update({
                            where: { id: existingUser.id },
                            data: { image: user.image }
                        });
                    }
                } catch (err) {
                    console.error('Google signIn callback error:', err);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session: updateData }: any) {
            if (user) {
                token.sub = user.id;
                token.role = (user as any).role || "USER";
                token.preferredLanguage = (user as any).preferredLanguage || "en";
            }
            // For Google OAuth, fetch DB user id and role
            if (account?.provider === 'google' && token.email) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: (token.email as string).toLowerCase() },
                        select: { id: true, role: true, preferredLanguage: true, phone: true, twoFactorEnabled: true }
                    });
                    if (dbUser) {
                        token.sub = dbUser.id;
                        token.role = dbUser.role;
                        token.preferredLanguage = dbUser.preferredLanguage || 'en';
                        token.needsOnboarding = !dbUser.phone;
                        // 관리자 2FA 체크
                        if ((dbUser.role === 'ADMIN' || dbUser.role === 'SUPERADMIN') && dbUser.twoFactorEnabled) {
                            token.twoFactorPending = true;
                        }
                    }
                } catch (err) {
                    console.error('JWT callback DB lookup error:', err);
                }
            }
            // Credentials 로그인 시 2FA 체크
            if (user && account?.provider === 'credentials') {
                const role = (user as any).role;
                if (role === 'ADMIN' || role === 'SUPERADMIN') {
                    try {
                        const dbUser = await prisma.user.findUnique({
                            where: { id: user.id },
                            select: { twoFactorEnabled: true }
                        });
                        if (dbUser?.twoFactorEnabled) {
                            token.twoFactorPending = true;
                        }
                    } catch {}
                }
            }
            // On session update (clear 2FA pending or re-check phone)
            if (trigger === 'update' && token.sub) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { id: token.sub as string },
                        select: { phone: true }
                    });
                    if (dbUser?.phone) token.needsOnboarding = false;
                    // twoFactorPending 해제 — 서버 사이드 nonce 검증 필수
                    // 클라이언트가 직접 { twoFactorVerified: true } 를 보내도 nonce가 없으면 무시됨
                    if (updateData?.twoFactorVerified) {
                        if (twoFactorCache.consume(token.sub as string)) {
                            token.twoFactorPending = false;
                        }
                    }
                } catch {}
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role || "USER";
                session.user.preferredLanguage = token.preferredLanguage || "en";
                session.user.needsOnboarding = token.needsOnboarding || false;
                session.user.twoFactorPending = token.twoFactorPending || false;
            }
            return session;
        },
    },
})

export const handlers = nextAuthEnv.handlers;
export const auth = nextAuthEnv.auth as any;
export const signIn = nextAuthEnv.signIn;
export const signOut = nextAuthEnv.signOut;
