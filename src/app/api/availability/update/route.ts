import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session ||!['ADMIN', 'BARBER', 'HEADOFBARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body: Record<string, { startTime: string; endTime: string; isActive: boolean }> = await req.json();
  const barberId = session.user.id;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.availability.deleteMany({
        where: { barberId: barberId },
      });

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
      }
    });

    return NextResponse.json({ message: 'Arbeitszeiten aktualisiert' }, { status: 200 });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json({ error: 'Fehler beim Speichern.' }, { status: 500 });
  }
}