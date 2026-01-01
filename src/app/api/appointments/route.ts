import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import ConfirmationEmail from '@/emails/ConfirmationEmail';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  console.log("API Route /api/appointments POST called");
  logger.info("API Route /api/appointments POST called");
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    console.warn("API Route /api/appointments: Unauthorized access attempt.");
    logger.warn("API Route /api/appointments: Unauthorized access attempt.");
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }
  console.log("API Route /api/appointments: User authorized.", { userId: session.user.id });
  logger.info("API Route /api/appointments: User authorized.", { userId: session.user.id });

  let response: NextResponse;
  try {
    const body = await req.json();
    console.log("API Route /api/appointments: Request body:", body);
    logger.info("API Route /api/appointments: Request body:", { body });
    const { serviceId, startTime, useFreeAppointment, locationId } = body;
    let { barberId } = body;
    const customerId = session.user.id;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 });
    }

    if (useFreeAppointment) {
      const customer = await prisma.user.findUnique({ where: { id: customerId } });
      if (!customer?.hasFreeAppointment) {
        return NextResponse.json({ error: 'Kein Gratis-Termin verfügbar' }, { status: 400 });
      }
      await prisma.user.update({
        where: { id: customerId },
        data: {
          hasFreeAppointment: false,
          completedAppointments: 0,
        },
      });
    }

    const appointmentStartTime = new Date(startTime);
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + service.duration * 60000);

    // Logic for 'Any Barber'
    if (barberId === 'any') {
      if (!locationId) {
        return NextResponse.json({ error: 'Standort ID erforderlich für automatische Zuweisung.' }, { status: 400 });
      }

      // Find potential barbers at this location
      const potentialBarbers = await prisma.user.findMany({
        where: {
          locations: { some: { id: locationId } },
          role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] }
        }
      });

      // Find one who is free
      let assignedBarberId: string | null = null;

      for (const barber of potentialBarbers) {
        // Check Availability
        const dayOfWeek = appointmentStartTime.getDay();
        const availability = await prisma.availability.findFirst({
          where: { barberId: barber.id, dayOfWeek }
        });

        if (!availability) continue;

        // Check bounds (simple check, assuming startTime is correct date)
        // Ideally we convert to Vienna time to compare hours
        // For now, relying on availability check logic similar to GET availability
        // But simplified: Just check if *start* and *end* of appointment are within availability hours
        // And no conflicts.

        // To be precise, we reuse the conflict check logic:

        const hasConflict = await prisma.appointment.findFirst({
          where: {
            barberId: barber.id,
            OR: [
              { startTime: { lt: appointmentEndTime }, endTime: { gt: appointmentStartTime } }
            ]
          }
        });

        const hasBlock = await prisma.blockedTime.findFirst({
          where: {
            barberId: barber.id,
            OR: [
              { startTime: { lt: appointmentEndTime }, endTime: { gt: appointmentStartTime } }
            ]
          }
        });

        if (!hasConflict && !hasBlock) {
          assignedBarberId = barber.id;
          break; // Found one!
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

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        barberId: barberId,
        startTime: appointmentStartTime,
      },
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'Dieser Zeitslot wurde gerade eben gebucht oder ist bereits belegt.' }, { status: 409 });
    }
    const newAppointment = await prisma.appointment.create({
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
        customer: true,
        barber: true,
        service: true,
      },
    });
    console.log("API Route /api/appointments: Appointment created successfully.", { appointmentId: newAppointment.id, userId: customerId });
    logger.info("API Route /api/appointments: Appointment created successfully.", { appointmentId: newAppointment.id, userId: session.user.id });

    try {
      await resend.emails.send({
        from: 'ALKOS <contact@alkosbarber.at>',
        to: newAppointment.customer.email,
        subject: 'Dein Termin wurde bestätigt!',
        react: ConfirmationEmail({
          customerName: newAppointment.customer.name || '',
          serviceName: newAppointment.service.name,
          barberName: newAppointment.barber.name || '',
          startTime: newAppointment.startTime,
          host: 'ALKOS'
        }),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (emailError: any) {
      logger.error("API Route /api/appointments: Error when sending confirmation email.", emailError);
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
    }
    response = NextResponse.json(newAppointment, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error('API Route /api/appointments - Booking error:', error);
    console.error('API Route /api/appointments - Booking error:', error);
    if (error instanceof NextResponse && error.status === 409) {
      response = error;
    } else {
      response = NextResponse.json({ error: 'Fehler bei der Terminerstellung.' }, { status: 500 });
    }
  } finally {
    logger.info("API Route /api/appointments POST: Flushing logs.");
    await logger.flush();
  }
  return response;
}