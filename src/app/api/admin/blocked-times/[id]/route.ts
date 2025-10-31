import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function DELETE(
  req: NextRequest,
) {
  const blockedTimeId = req.nextUrl.pathname.split('/').pop();
  logger.info("API Route /api/admin/blocked-times/[id] DELETE called", { blockedTimeId });
  let response: NextResponse;
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'BARBER', 'HEADOFBARBER'].includes(session.user.role)) {
    logger.warn("API Route /api/admin/blocked-times/[id] DELETE: Unauthorized.");
    response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    return response;
  }
  logger.info("API Route /api/admin/blocked-times/[id] DELETE: User authorized.", { userId: session.user.id, role: session.user.role });

  if (!blockedTimeId) {
    response = NextResponse.json({ error: 'Block-ID fehlt' }, { status: 400 });
    return response;
  }
  try {
    const blockedTime = await prisma.blockedTime.findUnique({
      where: { id: blockedTimeId },
      select: { barberId: true },
    });

    if (!blockedTime) {
      response = NextResponse.json({ error: 'Block-Zeit nicht gefunden' }, { status: 404 });
      return response;
    }

    const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);
    const isOwner = blockedTime.barberId === session.user.id;

    if (!isAdminOrHead && !isOwner) {
      logger.warn("API Route /api/admin/blocked-times/[id] DELETE: Forbidden. User is not owner or admin.", { userId: session.user.id, blockedTimeId });
      response = NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
      return response;
    }

    await prisma.blockedTime.delete({
      where: { id: blockedTimeId },
    });

    logger.info("API Route /api/admin/blocked-times/[id] DELETE: Blocked time deleted.", { blockedTimeId });
    response = NextResponse.json({ message: 'Zeitblockierung gelöscht' });
  } catch (error) {
    logger.error('API Route /api/admin/blocked-times/[id] DELETE - Error:', { error });
    response = NextResponse.json({ error: 'Fehler beim Löschen der Block-Zeit.' }, { status: 500 });
  } finally {
    logger.info("API Route /api/admin/blocked-times/[id] DELETE: Flushing logs.");
    await logger.flush();
  }
  return response!;
}