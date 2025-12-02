
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
    logger.info("API Route /api/auth/reset-password POST called");
    let response: NextResponse;
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
        logger.warn("API Route /api/auth/reset-password: Missing token or password.");
        response = NextResponse.json({ error: 'Fehlende Angaben.' }, { status: 400 });
        return response;
        }

        const resetToken = await prisma.passwordResetToken.findUnique({
        where: {
            token: token,
            redeemedAt: null,
            expiresAt: {
            gte: new Date(),
            },
        },
        });

        if (!resetToken) {
        logger.warn("API Route /api/auth/reset-password: Invalid or expired token.", { token });
        response = NextResponse.json({ error: 'Token ist ungültig oder abgelaufen.' }, { status: 400 });
        return response;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: {
            id: resetToken.userId,
            },
            data: {
            password: hashedPassword,
            },
        });

        await tx.passwordResetToken.update({
            where: {
            id: resetToken.id,
            },
            data: {
            redeemedAt: new Date(),
            },
        });
        });

        logger.info("API Route /api/auth/reset-password: Password reset successful.", { userId: resetToken.userId });
        response = NextResponse.json({ message: 'Passwort erfolgreich zurückgesetzt.' });

    } catch (error) {
        logger.error('API Route /api/auth/reset-password: General error.', { error });
        response = NextResponse.json({ error: 'Ein interner Fehler ist aufgetreten.' }, { status: 500 });
    } finally {
        logger.info("API Route /api/auth/reset-password: Flushing logs.");
        await logger.flush();
    }
    return response!;
}