import type { NextAuthConfig } from 'next-auth';

// This file is used specifically for the Next.js Edge runtime (Middleware)
// It does NOT import PrismaAdapter to avoid Edge runtime crash
export default {
    providers: [],
    pages: {
        signIn: '/admin/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 1 day
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.sub = user.id;
                token.role = user.role || "USER";
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role || "USER";
            }
            return session;
        },
    },
    ...(process.env.AUTH_SECRET ? { secret: process.env.AUTH_SECRET } : {}),
} satisfies NextAuthConfig;
