import NextAuth, { AuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email"; 
import bcrypt from "bcrypt";
import { User } from "@/generated/prisma";
import { Resend } from 'resend'
import VerificationEmail from '@/emails/VerificationEmail';
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";

const resend = new Resend(process.env.RESEND_API_KEY);

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        AppleProvider({
            clientId: process.env.APPLE_ID!,
            clientSecret: process.env.APPLE_SECRET!,
            checks: ["state"],
        }),
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        EmailProvider({
            server: {},
            from: "contact@alkosbarber.at",
            async sendVerificationRequest({ identifier: email, url, provider: { from } }) {
                try {
                    await resend.emails.send({
                        from: from,
                        to: email,
                        subject: "Bestätige deine E-Mail-Adresse für ALKOS",
                        react: VerificationEmail({ url, host: new URL(url).host }),
                    });
                } catch (error) {
                    console.error("Fehler beim Senden der Verifizierungs-E-Mail", error);
                }
            },
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await prisma.user.findUnique({ where: { email: credentials.email } });
                if (!user || !user.password) return null;

                const isValidPassword = await bcrypt.compare(credentials.password, user.password);
                if (!isValidPassword) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    emailVerified: user.emailVerified,
                };
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    callbacks: {
        async signIn({ user }) {
            if(!user.email) return false;

            const isBlacklisted = await prisma.blockedEmail.findUnique({
                where: { email: user.email }
            });
            if(isBlacklisted) {
                return false;
            }

            const dbUser = await prisma.user.findUnique({
                where: { email: user.email }
            });

            if(dbUser && dbUser.isBlocked) {
                return false;
            }

            return true;
        },
        async redirect({ url, baseUrl }) {
            if(url.includes('callback/email')) {
                return baseUrl + '/meine-termine';
            }

            if(url.startsWith('/')) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;

            return baseUrl;
        },
        async jwt({ token, user, account, profile, trigger }) {
            const isSignIn = !!user;
            console.log(`JWT Callback ${isSignIn ? 'SignIn' : 'Update'}:`, { tokenId: token?.id, userName: token?.name, userParam: user?.id, accountProvider: account?.provider, trigger });
            try {
                if (isSignIn && user) {
                    token.id = user.id;
                    token.role = (user as User).role || token.role;
                    token.emailVerified = (user as User).emailVerified || token.emailVerified;
                    console.log("JWT Callback during SignIn - Initial Token:", { id: token.id, role: token.role, emailVerified: token.emailVerified });
                }
                if(typeof token.id === 'string') {
                    const dbUser = await prisma.user.findUnique({ where: { id: token.id }});
                    if(!dbUser) {
                        console.warn("JWT Callback: DB User not found for token ID:", token.id);
                    } else {
                        token.emailVerified = dbUser.emailVerified;
                        token.name = dbUser.name;
                        token.picture = dbUser.image;
                        token.role = dbUser.role;
                        token.instagram = dbUser.instagram;
                        console.log("JWT Callback: DB User found and token updated.", { id: dbUser.id, role: dbUser.role, emailVerified: dbUser.emailVerified });
                    }
                } else if (isSignIn) {
                    console.error("JWT Callback SignIn Error: User object present but token ID could not be set.", { user });
                } else {
                    console.warn("JWT Callback Update Warning: Token ID is missing or invalid on update.", { token });
                }
            } catch (error) {
                console.error("Error in JWT Callback:", error);
            }
            console.log("JWT Callback End:", { tokenId: token?.id, userName: token?.name, role: token?.role });
            return token;
        },
        async session({ session, token }) {
            console.log("Session Callback Start:", { sessionUserId: session?.user?.id, tokenUserId: token?.id });
            if (token && token.id && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.emailVerified = token.emailVerified as Date | null;
                session.user.image = token.picture as string | null;
                session.user.name = token.name as string | null;
                session.user.instagram = token.instagram as string | null;
                console.log("Session Callback: Session updated from token.", { userId: session.user.id, role: session.user.role });
            } else {
                console.warn("Session Callback: Token is invalid or missing, session might be invalid.", { token });
            }
            console.log("Session Callback End:", { sessionUserId: session?.user?.id });
            return session;
        },
    },
    pages: {
        signIn: '/login',
        verifyRequest: '/verify-request',
    },
};
