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
    include: { locations: { select: { id: true } } }
  });
  const requesterIsAdmin = requester?.role === 'ADMIN';
  const requesterLocationIds = requester?.locations.map(l => l.id) || [];


  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { locations: { select: { id: true } } }
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
        const allAllowed = locationIds.every(id => requesterLocationIds.includes(id));
        if (!allAllowed) {
          return NextResponse.json({ error: 'Sie können nur Ihre eigenen Standorte zuweisen' }, { status: 403 });
        }
      }

      updateData.locations = {
        set: locationIds.map((id: string) => ({ id }))
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
      include: { locations: true }
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

  const requester = await prisma.user.findUnique({ where: { id: session.user.id }, include: { locations: true } });
  const requesterIsAdmin = requester?.role === 'ADMIN';

  if (!requesterIsAdmin) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, include: { locations: true } });

    if (!targetUser) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    if (targetUser.role === 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const requesterLocIds = requester?.locations.map(l => l.id) || [];
    const targetLocIds = targetUser.locations.map(l => l.id);

    const hasOverlap = targetLocIds.some(id => requesterLocIds.includes(id));
    if (!hasOverlap && targetLocIds.length > 0) {
      return NextResponse.json({ error: 'Nicht Ihr Zuständigkeitsbereich' }, { status: 403 });
    }
  }

  try {
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { customerId: targetUserId } }),
      prisma.appointment.deleteMany({ where: { barberId: targetUserId } }),
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