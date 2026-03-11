import type { NextAuthConfig } from 'next-auth';

// This file is used specifically for the Next.js Edge runtime (Middleware)
// It does NOT import PrismaAdapter to avoid Edge runtime crash
export default {
    providers: [],
    trustHost: true,   // Required for Cloud Run / reverse proxy deployments
    pages: {
        signIn: '/login',         // Regular user login page
        error: '/login',          // OAuth errors → redirect to /login?error=...
    },
    session: {
        strategy: 'jwt',
        maxAge: 24 * 60 * 60, // 1 day
    },
    callbacks: {
        async jwt({ token, user }: any) {
            if (user) {
                token.sub = user.id;
                token.role = (user as any).role || "USER";
                token.preferredLanguage = (user as any).preferredLanguage || "en";
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role || "USER";
                session.user.preferredLanguage = token.preferredLanguage || "en";
                session.user.needsOnboarding = token.needsOnboarding || false;
            }
            return session;
        },
    },
} satisfies NextAuthConfig;
