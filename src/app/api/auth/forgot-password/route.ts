import { logger } from "@/lib/logger";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from '@/lib/prisma';
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    logger.info("API Route /api/auth/forgot-password POST called");
    let response: NextResponse;
    try {
        const { email } = await req.json();

        if(!email) {
            logger.warn("API Route /api/auth/forgot-password: Missing email.");
            response = NextResponse.json({ error: 'E-Mail fehlt' }, { status: 400 });
            return response;
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if(!user || !user.password) {
            logger.warn("API Route /api/auth/forgot-password: User not found or has no password, sending generic success.", { email });
            response = NextResponse.json({ message: 'E-Mail wurde gesendet.' });
            return response;
        }

        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

        await prisma.passwordResetToken.create({
            data: {
                token,
                userId: user.id,
                expiresAt,
            },
        });

        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
        const host = new URL(process.env.NEXTAUTH_URL!).host;

        try {
            await resend.emails.send({
                from: 'ALKOS <contact@alkosbarber.at>',
                to: user.email,
                subject: 'Setze dein ALKOS Passwort zurück',
                react: ResetPasswordEmail({ url: resetUrl, host: host }),
            });
            logger.info("API Route /api/auth/forgot-password: Reset email sent.", { userId: user.id });
        } catch (emailError) {
            logger.error("API Route /api/auth/forgot-password: Resend error.", { emailError });
        }

        response = NextResponse.json({ message: 'E-Mail wurde gesendet.' });
    } catch (error) {
        logger.error('API Route /api/auth/forgot-password: General error.', { error });
        response = NextResponse.json({ error: 'Ein interner Fehler ist aufgetreten.' }, { status: 500 });
    } finally {
    logger.info("API Route /api/auth/forgot-password: Flushing logs.");
    await logger.flush();
  }
  return response!;
}