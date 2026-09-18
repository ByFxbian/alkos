import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { PrismaClientKnownRequestError } from '@/generated/prisma/runtime/library';
import { Resend } from 'resend';
import CancellationEmail from '@/emails/CancellationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function DELETE(
  req: NextRequest,
) {
  const session = await getServerSession(authOptions);
  const appointmentId = req.nextUrl.pathname.split('/').pop();
  logger.info("API Route /api/admin/appointments/[id] DELETE called", { appointmentId });
  let response: NextResponse;
  try {
    if (!session || !session.user) {
      logger.warn("API Route /api/admin/appointments/[id] DELETE: Unauthorized (not logged in).", { appointmentId });
      response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
      return response;
    } 
    logger.info("API Route /api/admin/appointments/[id] DELETE: User identified.", { userId: session.user.id, role: session.user.role, appointmentId });

    if(!appointmentId) {
      logger.error("API Route /api/admin/appointments/[id] DELETE: Missing appointment ID.");
      response = NextResponse.json({ error: 'Termin-ID fehlt.' }, { status: 400 });
    } else {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          customer: true,
          service: true,
          location: true,
        },
      });
      if (!appointment) {
        logger.warn("API Route /api/admin/appointments/[id] DELETE: Appointment not found during auth check.", { appointmentId, userId: session.user.id });
        response = NextResponse.json({ error: 'Zu löschender Termin nicht gefunden.' }, { status: 404 });
      } else {
        const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);
        const isOwnAppointment = session.user.role === 'BARBER' && appointment.barberId === session.user.id;

        if (session.user.role === 'HEADOFBARBER') {
          const requester = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { userLocations: { select: { locationId: true } } },
          });
          const allowedLocationIds = requester?.userLocations.map((ul) => ul.locationId) || [];
          if (!appointment.locationId || !allowedLocationIds.includes(appointment.locationId)) {
            response = NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
            return response;
          }
        }

        if (!isAdminOrHead && !isOwnAppointment) {
          logger.warn("API Route /api/admin/appointments/[id] DELETE: Forbidden access attempt.", {
              appointmentId,
              appointmentBarberId: appointment.barberId,
              requestingUserId: session.user.id,
              requestingUserRole: session.user.role
          });
          response = NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
        } else {
          logger.info("API Route /api/admin/appointments/[id] DELETE: User authorized for deletion.", { userId: session.user.id, role: session.user.role, appointmentId });

          // Send cancellation email if customer has a valid email (not walkin placeholder)
          if (appointment.customer?.email && !appointment.customer.email.includes('walkin@')) {
            try {
              await resend.emails.send({
                from: 'ALKOS <contact@alkosbarber.at>',
                to: appointment.customer.email,
                subject: 'Dein Termin wurde storniert',
                react: CancellationEmail({
                  customerName: appointment.customer.name || '',
                  serviceName: appointment.service?.name || 'Haarschnitt',
                  startTime: appointment.startTime,
                  host: 'ALKOS',
                  locationName: appointment.location?.name,
                  locationAddress: appointment.location?.address,
                }),
              });
              logger.info("API Route /api/admin/appointments/[id] DELETE: Cancellation email sent.", { to: appointment.customer.email, appointmentId });
            } catch (emailError) {
              logger.error('API Route /api/admin/appointments/[id] DELETE: Failed to send cancellation email:', { appointmentId, error: emailError });
              console.error('Fehler beim Senden der Stornierungs-E-Mail durch Admin:', emailError);
            }
          }

          await prisma.$transaction(async (tx) => {
            const deletedTokens = await tx.stampToken.deleteMany({
              where: { appointmentId: appointmentId },
            });
            logger.info("API Route /api/admin/appointments/[id] DELETE: Deleted associated stamp tokens.", { appointmentId, count: deletedTokens.count });

            await tx.appointment.delete({
              where: { id: appointmentId },
            });
            logger.info("API Route /api/admin/appointments/[id] DELETE: Appointment deleted successfully.", { appointmentId, deletedByUserId: session.user.id });
          });

          response = NextResponse.json({ message: 'Termin erfolgreich vom Admin gelöscht' });
        }
      }
    }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    logger.error('API Route /api/admin/appointments/[id] DELETE - Deletion error:', { appointmentId, userId: session?.user?.id, error });
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        logger.warn("API Route /api/admin/appointments/[id] DELETE: Record to delete not found.", { appointmentId });
        response = NextResponse.json({ error: 'Zu löschender Termin nicht gefunden.' }, { status: 404 });
    } else {
        response = NextResponse.json({ error: 'Fehler beim Löschen des Termins.' }, { status: 500 });
    }
  } finally {
      logger.info("API Route /api/admin/appointments/[id] DELETE: Flushing logs.");
      await logger.flush();
  }
  if (!response!) {
      logger.error("API Route /api/admin/appointments/[id] DELETE: Reached end without setting a response.");
      response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
      await logger.flush();
  }
  return response!;
}
