import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  logger.info("API Route /api/availability/update POST called");
  const session = await getServerSession(authOptions);
  let response: NextResponse;

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/availability/update POST: Unauthorized access attempt.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }

  try {
    const body = await req.json();
    const { locationId, schedule, barberId } = body as {
      locationId: string;
      barberId?: string | null;
      schedule: Record<string, { startTime: string; endTime: string; isActive: boolean }>;
    };

    if (!locationId) {
      return NextResponse.json({ error: 'Location ID fehlt' }, { status: 400 });
    }

    const targetBarberId = barberId && barberId !== 'all' ? barberId : null;

    logger.info("API Route /api/availability/update POST: Saving hours.", { locationId, targetBarberId, scheduleKeys: Object.keys(schedule) });

    await prisma.$transaction(async (tx) => {
      const deleted = await tx.availability.deleteMany({
        where: {
          locationId: locationId,
          barberId: targetBarberId,
        },
      });
      logger.info("API Route /api/availability/update POST: Deleted old hours.", { locationId, targetBarberId, count: deleted.count });

      const newAvailabilities = [];
      for (const dayIdStr in schedule) {
        const dayId = parseInt(dayIdStr, 10);
        const { startTime, endTime, isActive } = schedule[dayIdStr];

        if (isActive) {
          newAvailabilities.push({
            dayOfWeek: dayId,
            startTime,
            endTime,
            locationId,
            barberId: targetBarberId,
          });
        }
      }

      if (newAvailabilities.length > 0) {
        await tx.availability.createMany({
          data: newAvailabilities,
        });
        logger.info("API Route /api/availability/update POST: Created new hours.", { locationId, targetBarberId, count: newAvailabilities.length });
      }
    });

    response = NextResponse.json({ message: 'Arbeitszeiten erfolgreich aktualisiert' }, { status: 200 });
  } catch (error) {
    logger.error('API Route /api/availability/update POST - Update availability error:', { userId: session?.user?.id, error });
    console.error('Update availability error:', error);
    response = NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 });
  } finally {
    await logger.flush();
  }
  return response!;
}