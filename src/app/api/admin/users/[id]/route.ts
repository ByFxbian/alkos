/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id: targetUserId } = await params;

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (session.user.id === targetUserId) {
    return NextResponse.json({ error: 'Eigene Rolle/Daten kann nicht hier geändert werden' }, { status: 403 });
  }


  const requester = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { userLocations: { select: { locationId: true } } }
  });
  const requesterIsAdmin = requester?.role === 'ADMIN';
  const requesterLocationIds = requester?.userLocations.map(ul => ul.locationId) || [];


  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { userLocations: { select: { locationId: true } } }
  });

  if (!targetUser) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });


  if (!requesterIsAdmin) {
    if (requesterLocationIds.length === 0) {
      return NextResponse.json({ error: 'Keine Berechtigung (Kein Standort)' }, { status: 403 });
    }

    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins können nur von Admins bearbeitet werden' }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { role, locationIds } = body as { role: Role; locationIds?: string[] };

    const updateData: any = {};

    if (role) {
      if (!requesterIsAdmin && role === 'ADMIN') {
        return NextResponse.json({ error: 'Nicht autorisiert, Admin-Rolle zu vergeben' }, { status: 403 });
      }
      updateData.role = role as Role;
    }

    if (locationIds && Array.isArray(locationIds)) {
      if (!requesterIsAdmin) {
        const allAllowed = locationIds.every((loc: any) => {
          const id = typeof loc === 'string' ? loc : loc.locationId;
          return requesterLocationIds.includes(id);
        });
        if (!allAllowed) {
          return NextResponse.json({ error: 'Sie können nur Ihre eigenen Standorte zuweisen' }, { status: 403 });
        }
      }

      await prisma.userLocation.deleteMany({ where: { userId: targetUserId } });
      if (locationIds.length > 0) {
        await prisma.userLocation.createMany({
          data: locationIds.map((loc: any) => {
            const id = typeof loc === 'string' ? loc : loc.locationId;
            const bookable = typeof loc === 'object' && 'isBookable' in loc ? loc.isBookable : true;
            return { userId: targetUserId, locationId: id, isBookable: bookable };
          })
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: { userLocations: { include: { location: true } } }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { id: targetUserId } = await params;

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (session.user.id === targetUserId) {
    return NextResponse.json({ error: 'Man kann sich nicht selbst löschen' }, { status: 403 });
  }

  const requester = await prisma.user.findUnique({ where: { id: session.user.id }, include: { userLocations: true } });
  const requesterIsAdmin = requester?.role === 'ADMIN';

  if (!requesterIsAdmin) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, include: { userLocations: true } });

    if (!targetUser) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    if (targetUser.role === 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const requesterLocIds = requester?.userLocations.map(ul => ul.locationId) || [];
    const targetLocIds = targetUser.userLocations.map(ul => ul.locationId);

    const hasOverlap = targetLocIds.some(id => requesterLocIds.includes(id));
    if (!hasOverlap && targetLocIds.length > 0) {
      return NextResponse.json({ error: 'Nicht Ihr Zuständigkeitsbereich' }, { status: 403 });
    }
  }

  try {
    const appointmentCount = await prisma.appointment.count({
      where: {
        OR: [
          { customerId: targetUserId },
          { barberId: targetUserId }
        ]
      }
    });

    if (appointmentCount > 0) {
      return NextResponse.json(
        {
          error: 'Datenintegrität geschützt: Dieser Benutzer hat eine Terminhistorie. Bitte ändern Sie die Rolle zu "KUNDE" oder sperren Sie den Account, anstatt ihn zu löschen.'
        },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.availability.deleteMany({ where: { barberId: targetUserId } }),
      prisma.blockedTime.deleteMany({ where: { barberId: targetUserId } }),
      prisma.account.deleteMany({ where: { userId: targetUserId } }),
      prisma.session.deleteMany({ where: { userId: targetUserId } }),
      prisma.user.delete({ where: { id: targetUserId } }),
    ]);

    return NextResponse.json({ message: 'Benutzer gelöscht' });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen des Benutzers' }, { status: 500 });
  }
}