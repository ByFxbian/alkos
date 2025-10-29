import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { PrismaClientKnownRequestError } from '@/generated/prisma/runtime/library';

export async function DELETE(
  req: NextRequest,
) {
  //const { params } = context as { params: { id: string } };
  const session = await getServerSession(authOptions);
  //const { id: appointmentId } = params;
  const appointmentId = req.nextUrl.pathname.split('/').pop();
  let response: NextResponse;
  try {
    const allowedRoles = ['ADMIN', 'HEADOFBARBER'];
    if (!session || !session.user || !allowedRoles.includes(session.user.role)) {
      logger.warn("API Route /api/admin/appointments/[id] DELETE: Forbidden access attempt.", {
        appointmentId,
        requestingUserId: session?.user?.id,
        requestingUserRole: session?.user?.role
      });
      response = NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    } else {
      logger.info("API Route /api/admin/appointments/[id] DELETE: User authorized.", { userId: session.user.id, role: session.user.role, appointmentId });
      if(!appointmentId) {
        response = NextResponse.json({ error: 'Termin-ID fehlt.' }, { status: 400 });
      } else {
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