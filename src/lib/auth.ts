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
        async redirect({ url, baseUrl }) {
            if(url.includes('callback/email')) {
                return baseUrl + '/meine-termine';
            }

            if(url.startsWith('/')) return `${baseUrl}${url}`;
            else if (new URL(url).origin === baseUrl) return url;

            return baseUrl;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as User).role;
                token.emailVerified = (user as User).emailVerified;
            }

            const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } });
            if (dbUser) {
                token.emailVerified = dbUser.emailVerified;
                token.name = dbUser.name;
                token.picture = dbUser.image;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.emailVerified = token.emailVerified as Date | null;
                session.user.image = token.picture as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
        verifyRequest: '/verify-request',
    },
};
