import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const serviceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  duration: z.coerce.number().int().positive("Dauer muss positiv sein"),
  price: z.coerce.number().positive("Preis muss positiv sein"),
  locationId: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER', 'BARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.role === 'ADMIN';
  const userLocs = !isAdmin ? await prisma.user.findUnique({ where: { id: session.user.id }, include: { locations: true } }) : null;
  const allowedIds = userLocs?.locations.map(l => l.id) || [];

  let whereClause: any = {};
  if (!isAdmin) {
    if (allowedIds.length > 0) {
      whereClause = {
        OR: [
          { locationId: null },
          { locationId: { in: allowedIds } }
        ]
      };
    } else {
      whereClause = { locationId: null };
    }
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    include: { location: { select: { name: true } } },
    orderBy: { price: 'asc' }
  });
  return NextResponse.json(services);
}

export async function POST(req: Request) {
  logger.info("API Route /api/admin/services POST called");
  let response: NextResponse;
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/admin/services POST: Unauthorized.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }

  try {
    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("API Route /api/admin/services POST: Invalid input.", { error: validation.error });
      response = NextResponse.json({ error: 'Ungültige Eingabe', details: validation.error.format() }, { status: 400 });
      return response;
    }

    const { name, duration, price, locationId } = validation.data;

    if (session.user.role !== 'ADMIN') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { locations: { select: { id: true } } }
      });

      if (!locationId) {
        return NextResponse.json({ error: 'Nur Admins können globale Services erstellen.' }, { status: 403 });
      }

      const isAssigned = user?.locations.some(l => l.id === locationId);
      if (!isAssigned) {
        return NextResponse.json({ error: 'Nicht berechtigt für diesen Standort.' }, { status: 403 });
      }
    }

    const newService = await prisma.service.create({
      data: {
        name,
        duration,
        price,
        locationId: locationId || null
      },
    });

    revalidatePath('/termine');

    logger.info("API Route /api/admin/services POST: Service created.", { serviceId: newService.id });
    response = NextResponse.json(newService, { status: 201 });

  } catch (error) {
    logger.error('API Route /api/admin/services POST - Error:', { error });
    response = NextResponse.json({ error: 'Fehler beim Erstellen des Service.' }, { status: 500 });
  } finally {
    await logger.flush();
  }
  return response!;
}