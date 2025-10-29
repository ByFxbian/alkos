import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  logger.info("API Route /api/availability/update POST called"); // Logging Start
  const session = await getServerSession(authOptions);
  let response: NextResponse;

  if (!session ||!['ADMIN', 'BARBER', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/availability/update POST: Unauthorized access attempt.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }

  const barberId = session.user.id;
  logger.info("API Route /api/availability/update POST: User authorized.", { userId: barberId, role: session.user.role });

  try {
    const body: Record<string, { startTime: string; endTime: string; isActive: boolean }> = await req.json();
    logger.info("API Route /api/availability/update POST: Received schedule data.", { userId: barberId, scheduleKeys: Object.keys(body) });

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.availability.deleteMany({
        where: { barberId: barberId },
      });
      logger.info("API Route /api/availability/update POST: Deleted old availabilities.", { userId: barberId, count: deleted.count });

      const newAvailabilities = [];
      for (const dayIdStr in body) {
        const dayId = parseInt(dayIdStr, 10);
        const { startTime, endTime, isActive } = body[dayIdStr];

        if (isActive) {
          newAvailabilities.push({
            dayOfWeek: dayId,
            startTime,
            endTime,
            barberId,
          });
        }
      }

      if (newAvailabilities.length > 0) {
        await tx.availability.createMany({
          data: newAvailabilities,
        });
        logger.info("API Route /api/availability/update POST: Created new availabilities.", { userId: barberId, count: newAvailabilities.length });
      } else {
        logger.info("API Route /api/availability/update POST: No active days found, schedule cleared.", { userId: barberId });
      }
    });

    response = NextResponse.json({ message: 'Arbeitszeiten aktualisiert' }, { status: 200 });
  } catch (error) {
    logger.error('API Route /api/availability/update POST - Update availability error:', { userId: session?.user?.id, error }); // Logging Fehler
    console.error('Update availability error:', error);
    response = NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 });
  } finally {
     logger.info("API Route /api/availability/update POST: Flushing logs.");
    await logger.flush(); // Flush am Ende
  }
  if (!response!) {
      logger.error("API Route /api/availability/update POST: Reached end without setting a response.");
      response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
      await logger.flush();
  }
  return response!;
}