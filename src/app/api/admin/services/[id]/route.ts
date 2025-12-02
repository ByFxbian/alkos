import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { Prisma } from '@/generated/prisma';
import { revalidatePath } from 'next/cache';

const serviceSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  duration: z.coerce.number().int().positive("Dauer muss positiv sein"),
  price: z.coerce.number().positive("Preis muss positiv sein"),
});

export async function PUT(req: NextRequest) {
  const serviceId = req.nextUrl.pathname.split('/').pop();
  logger.info("API Route /api/admin/services/[id] PUT called", { serviceId });
  let response: NextResponse;
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/admin/services/[id] PUT: Unauthorized.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }

  if (!serviceId) {
    return NextResponse.json({ error: 'Service-ID fehlt' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const validation = serviceSchema.safeParse(body);

    if (!validation.success) {
      logger.warn("API Route /api/admin/services/[id] PUT: Invalid input.", { error: validation.error });
      response = NextResponse.json({ error: 'Ungültige Eingabe', details: validation.error.format() }, { status: 400 });
      return response;
    }

    const { name, duration, price } = validation.data;

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: { name, duration, price },
    });

    revalidatePath('/termine');

    logger.info("API Route /api/admin/services/[id] PUT: Service updated.", { serviceId });
    response = NextResponse.json(updatedService);

  } catch (error) {
    logger.error('API Route /api/admin/services/[id] PUT - Error:', { error });
    response = NextResponse.json({ error: 'Fehler beim Bearbeiten des Service.' }, { status: 500 });
  } finally {
    await logger.flush();
  }
  return response!;
}

export async function DELETE(req: NextRequest) {
  const serviceId = req.nextUrl.pathname.split('/').pop();
  logger.info("API Route /api/admin/services/[id] DELETE called", { serviceId });
  let response: NextResponse;
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/admin/services/[id] DELETE: Unauthorized.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }

  if (!serviceId) {
    return NextResponse.json({ error: 'Service-ID fehlt' }, { status: 400 });
  }

  try {
    await prisma.service.delete({
      where: { id: serviceId },
    });

    revalidatePath('/termine');

    logger.info("API Route /api/admin/services/[id] DELETE: Service deleted.", { serviceId });
    response = NextResponse.json({ message: 'Service gelöscht' });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      logger.warn("API Route /api/admin/services/[id] DELETE: Cannot delete service, appointments attached.", { serviceId });
      response = NextResponse.json({ error: 'Service kann nicht gelöscht werden, da noch Termine damit verknüpft sind.' }, { status: 409 });
    } else {
      logger.error('API Route /api/admin/services/[id] DELETE - Error:', { error });
      response = NextResponse.json({ error: 'Fehler beim Löschen des Service.' }, { status: 500 });
    }
  } finally {
    await logger.flush();
  }
  return response!;
}