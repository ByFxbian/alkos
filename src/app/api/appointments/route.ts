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
    const { barberId, serviceId, startTime, useFreeAppointment  } = body;
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

    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const isLastMinuteBooking = appointmentStartTime < twentyFourHoursFromNow;

    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        barberId: barberId,
        startTime: appointmentStartTime,
      },
    });

    if(existingAppointment) {
      return NextResponse.json({ error: 'Dieser Zeitslot wurde gerade eben gebucht oder ist bereits belegt.'}, { status: 409 });
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