import { authOptions } from '@/lib/auth';
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  logger.info("API Route /api/stamps/redeem POST called"); // Logging Start
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    logger.warn("API Route /api/stamps/redeem POST: Unauthorized access attempt.");
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  logger.info("API Route /api/stamps/redeem POST: User authorized.", { userId: session.user.id });

  try {
    const { token } = await req.json();
    logger.info("API Route /api/stamps/redeem POST: Attempting to redeem token.", { userId: session.user.id, tokenProvided: !!token });
    if (!token) {
      logger.warn("API Route /api/stamps/redeem POST: Missing token.", { userId: session.user.id });
      return NextResponse.json({ error: 'Token fehlt' }, { status: 400 });
    }

    const stampToken = await prisma.stampToken.findUnique({
      where: { token },
      include: {
        appointment: {
          select: { customerId: true },
        },
      },
    });


    if (!stampToken || !stampToken.appointment || stampToken.redeemedAt || new Date() > stampToken.expiresAt) {
      logger.warn("API Route /api/stamps/redeem POST: Invalid or expired token.", {
        userId: session.user.id,
        token,
        found: !!stampToken,
        redeemed: !!stampToken?.redeemedAt,
        expired: stampToken ? new Date() > stampToken.expiresAt : null
      });
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener QR-Code' }, { status: 400 });
    }

    if (stampToken.appointment.customerId !== session.user.id) {
      logger.warn("API Route /api/stamps/redeem POST: Forbidden. Token does not belong to user.", {
        userId: session.user.id,
        tokenCustomerId: stampToken.appointment.customerId,
        tokenId: stampToken.id
      });
      return NextResponse.json({ error: 'Dieser Stempel gehört nicht dir.' }, { status: 403 });
    }

    const customerIdToUpdate = stampToken.appointment.customerId;

    await prisma.$transaction(async (tx) => {
      await tx.stampToken.update({
        where: { id: stampToken.id },
        data: { redeemedAt: new Date() },
      });

      const user = await tx.user.findUnique({ where: { id: customerIdToUpdate } });
      if (user) {
        const newCount = user.completedAppointments + 1;
        await tx.user.update({
          where: { id: customerIdToUpdate },
          data: {
            completedAppointments: newCount,
            hasFreeAppointment: newCount >= 15 ? true : user.hasFreeAppointment,
          },
        });
      }
    });
    logger.info("API Route /api/stamps/redeem POST: Stamp redeemed successfully.", { userId: session.user.id, tokenId: stampToken.id });

    return NextResponse.json({ message: 'Stempel erfolgreich erhalten!' });
  } catch (error) {
    logger.error('API Route /api/stamps/redeem POST - Redeem stamp error:', { userId: session?.user?.id, error }); // Logging Fehler
    console.error('Redeem stamp error:', error);
    return NextResponse.json({ error: 'Fehler beim Einlösen des Stempels.' }, { status: 500 });
  }
}