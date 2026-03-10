import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/api"
import bcrypt from "bcryptjs"
import authConfig from "./auth.config"

const nextAuthEnv = NextAuth({
    ...authConfig,
    session: { strategy: 'jwt' },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                // Normalize email to lowercase to avoid case-sensitivity issues
                const email = (credentials.email as string).toLowerCase().trim();

                const user = await prisma.user.findUnique({
                    where: { email }
                })

                // hashedPassword is null for OAuth-only accounts — skip them
                if (!user || !user.hashedPassword) return null

                const passwordsMatch = await bcrypt.compare(
                    credentials.password as string,
                    user.hashedPassword
                )

                if (passwordsMatch) {
                    return user
                }
                return null
            }
        })
    ],
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account }) {
            // For OAuth providers, ensure the user exists in our DB
            // NextAuth v5 handles Account linking automatically via the Account model
            // but we need to make sure the user record has the right role set
            if (account?.provider === 'google' && user?.email) {
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
        async jwt({ token, user, account }: any) {
            if (user) {
                token.sub = user.id;
                token.role = (user as any).role || "USER";
                token.preferredLanguage = (user as any).preferredLanguage || "en";
            }
            // For Google OAuth, fetch DB user id and role since user.id may be the provider id
            if (account?.provider === 'google' && token.email) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: (token.email as string).toLowerCase() },
                        select: { id: true, role: true, preferredLanguage: true }
                    });
                    if (dbUser) {
                        token.sub = dbUser.id;
                        token.role = dbUser.role;
                        token.preferredLanguage = dbUser.preferredLanguage || 'en';
                    }
                } catch (err) {
                    console.error('JWT callback DB lookup error:', err);
                }
            }
            return token;
        },
        async session({ session, token }: any) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
                session.user.role = token.role || "USER";
                session.user.preferredLanguage = token.preferredLanguage || "en";
            }
            return session;
        },
    },
})

export const handlers = nextAuthEnv.handlers;
export const auth = nextAuthEnv.auth as any;
export const signIn = nextAuthEnv.signIn;
export const signOut = nextAuthEnv.signOut;
