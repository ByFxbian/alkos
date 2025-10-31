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
});

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

    const { name, duration, price } = validation.data;

    const newService = await prisma.service.create({
      data: {
        name,
        duration,
        price,
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