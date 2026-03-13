import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import ConfirmationEmail from '@/emails/ConfirmationEmail';
import { logger } from '@/lib/logger';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { PrismaClientKnownRequestError } from '@/generated/prisma/runtime/library';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  logger.info('API Route /api/appointments POST called');

  const ip = getClientIp(req);
  const rl = checkRateLimit(`appointments-create:${ip}`, { limit: 30, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte später erneut versuchen.' }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  let response: NextResponse;
  try {
    const body = await req.json();
    const { serviceId, startTime, useFreeAppointment, locationId } = body;
    let { barberId } = body;
    const customerId = session.user.id;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 });
    }

    let locationData = null;
    if (locationId) {
      locationData = await prisma.location.findUnique({ where: { id: locationId } });
      if (locationData?.slug === 'baden') {
        const appointmentStart = new Date(startTime);
        const badenStartDateTime = new Date('2026-03-07T12:00:00+01:00');
        if (appointmentStart < badenStartDateTime) {
          return NextResponse.json(
            { error: 'Termine für diesen Standort sind erst ab dem 07.03.2026 um 12:00 Uhr buchbar.' },
            { status: 400 }
          );
        }
      }
    }

    const appointmentStartTime = new Date(startTime);
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + service.duration * 60000);

    if (barberId === 'any') {
      if (!locationId) {
        return NextResponse.json({ error: 'Standort ID erforderlich für automatische Zuweisung.' }, { status: 400 });
      }

      const potentialBarbers = await prisma.user.findMany({
        where: {
          userLocations: { some: { locationId, isBookable: true } },
          role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
        },
      });

      let assignedBarberId: string | null = null;

      for (const barber of potentialBarbers) {
        const dayOfWeek = appointmentStartTime.getDay();
        const availability = await prisma.availability.findFirst({
          where: { barberId: barber.id, dayOfWeek },
        });
        if (!availability) continue;

        const [hasConflict, hasBlock] = await Promise.all([
          prisma.appointment.findFirst({
            where: {
              barberId: barber.id,
              OR: [{ startTime: { lt: appointmentEndTime }, endTime: { gt: appointmentStartTime } }],
            },
            select: { id: true },
          }),
          prisma.blockedTime.findFirst({
            where: {
              barberId: barber.id,
              OR: [{ startTime: { lt: appointmentEndTime }, endTime: { gt: appointmentStartTime } }],
            },
            select: { id: true },
          }),
        ]);

        if (!hasConflict && !hasBlock) {
          assignedBarberId = barber.id;
          break;
        }
      }

      if (!assignedBarberId) {
        return NextResponse.json({ error: 'Kein Barber mehr verfügbar für diese Zeit.' }, { status: 409 });
      }
      barberId = assignedBarberId;
    }

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const isLastMinuteBooking = appointmentStartTime < twentyFourHoursFromNow;

    const newAppointment = await prisma.$transaction(async (tx) => {
      const existingAppointment = await tx.appointment.findFirst({
        where: {
          barberId,
          startTime: appointmentStartTime,
        },
        select: { id: true },
      });
      if (existingAppointment) {
        throw new Error('SLOT_TAKEN');
      }

      if (useFreeAppointment) {
        const customer = await tx.user.findUnique({ where: { id: customerId }, select: { hasFreeAppointment: true } });
        if (!customer?.hasFreeAppointment) {
          throw new Error('NO_FREE_APPOINTMENT');
        }
        await tx.user.update({
          where: { id: customerId },
          data: {
            hasFreeAppointment: false,
            completedAppointments: 0,
          },
        });
      }

      return tx.appointment.create({
        data: {
          startTime: appointmentStartTime,
          endTime: appointmentEndTime,
          customerId,
          barberId,
          serviceId,
          isFree: useFreeAppointment || false,
          reminderSentAt: isLastMinuteBooking ? new Date() : null,
          locationId: locationId || null,
        },
        include: {
          customer: {
            select: { id: true, email: true, name: true },
          },
          barber: {
            select: { id: true, name: true },
          },
          service: {
            select: { id: true, name: true, duration: true, price: true },
          },
        },
      });
    });

    try {
      await resend.emails.send({
        from: 'ALKOS <contact@alkosbarber.at>',
        to: newAppointment.customer.email,
        subject: 'Dein Termin wurde bestätigt!',
        react: ConfirmationEmail({
          customerName: newAppointment.customer.name || '',
          serviceName: newAppointment.service.name,
          barberName: newAppointment.barber.name || '',
          startTime: appointmentStartTime,
          host: 'ALKOS',
          locationName: locationData?.name,
          locationAddress: locationData?.address,
        }),
      });
    } catch (emailError) {
      logger.error('API Route /api/appointments: Error when sending confirmation email.', {
        appointmentId: newAppointment.id,
        error: emailError,
      });
    }

    response = NextResponse.json(newAppointment, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'SLOT_TAKEN') {
      response = NextResponse.json(
        { error: 'Dieser Zeitslot wurde gerade eben gebucht oder ist bereits belegt.' },
        { status: 409 }
      );
    } else if (error instanceof Error && error.message === 'NO_FREE_APPOINTMENT') {
      response = NextResponse.json({ error: 'Kein Gratis-Termin verfügbar' }, { status: 400 });
    } else if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      response = NextResponse.json(
        { error: 'Dieser Zeitslot wurde gerade eben gebucht oder ist bereits belegt.' },
        { status: 409 }
      );
    } else {
      logger.error('API Route /api/appointments - Booking error:', { error });
      response = NextResponse.json({ error: 'Fehler bei der Terminerstellung.' }, { status: 500 });
    }
  } finally {
    await logger.flush();
  }

  return response!;
}
