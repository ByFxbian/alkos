import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import CancellationEmail from '@/emails/CancellationEmail';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function DELETE(
  req: NextRequest,
) {
  const appointmentId = req.nextUrl.pathname.split('/').pop();
  logger.info("API Route /api/appointments/[id] DELETE called", { appointmentId }); // Logging Start
  const session = await getServerSession(authOptions);
  //const { id: appointmentId } = params;
  let response: NextResponse;

  if (!session || !session.user) {
    logger.warn("API Route /api/appointments/[id] DELETE: Unauthorized access attempt.", { appointmentId });
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }
  logger.info("API Route /api/appointments/[id] DELETE: User authorized.", { userId: session.user.id, appointmentId });

  if (!appointmentId) {
    logger.error("API Route /api/appointments/[id] DELETE: Missing appointment ID in request path.");
    response = NextResponse.json({ error: 'Termin-ID fehlt in der Anfrage.' }, { status: 400 });
    return response
  }
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment) {
      logger.warn("API Route /api/appointments/[id] DELETE: Appointment not found.", { appointmentId, userId: session.user.id });
      response = NextResponse.json({ error: 'Termin nicht gefunden.' }, { status: 404 });
      return response;
    }

    if (appointment.customerId !== session.user.id && session.user.role !== 'ADMIN') {
      logger.warn("API Route /api/appointments/[id] DELETE: Forbidden access attempt.", {
        appointmentId,
        appointmentCustomerId: appointment.customerId,
        requestingUserId: session.user.id,
        requestingUserRole: session.user.role
      });
      response = NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
      return response;
    }

    try {
      await resend.emails.send({
        from: 'ALKOS <contact@alkosbarber.at>', 
        to: appointment.customer.email,
        subject: 'Dein Termin wurde storniert',
        react: CancellationEmail({
          customerName: appointment.customer.name || '',
          serviceName: appointment.service.name,
          startTime: appointment.startTime,
          host: 'ALKOS'
        }),
      });
      logger.info("API Route /api/appointments/[id] DELETE: Cancellation email sent.", { to: appointment.customer.email, appointmentId });
    } catch (emailError) {
      logger.error('API Route /api/appointments/[id] DELETE: Failed to send cancellation email:', { appointmentId, error: emailError });
      console.error('Fehler beim Senden der Stornierungs-E-Mail:', emailError);
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });
    logger.info("API Route /api/appointments/[id] DELETE: Appointment deleted successfully.", { appointmentId, deletedByUserId: session.user.id });

    response = NextResponse.json({ message: 'Termin erfolgreich storniert' }, { status: 200 });
  } catch (error) {
    console.error('Cancellation error:', error);
    logger.error('API Route /api/appointments/[id] DELETE - Cancellation error:', { appointmentId, userId: session?.user?.id, error }); // Logging Fehler
    response = NextResponse.json({ error: 'Fehler bei der Stornierung.' }, { status: 500 });
  } finally {
    logger.info("API Route /api/appointments/[id] DELETE: Flushing logs.");
    await logger.flush();
  }
  if(!response!) {
    logger.error("API Route /api/appointments/[id] DELETE: Reached end without setting a response.");
    response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    await logger.flush();
  }
  return response!;
}