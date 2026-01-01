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

  // CONTEXT: Requester
  const requester = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { locations: { select: { id: true } } }
  });
  const requesterIsAdmin = requester?.role === 'ADMIN';
  const requesterLocationIds = requester?.locations.map(l => l.id) || [];

  // CONTEXT: Target
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { locations: { select: { id: true } } }
  });

  if (!targetUser) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });

  // SECURITY: HEADOFBARBER Scope Check
  if (!requesterIsAdmin) {
    if (requesterLocationIds.length === 0) {
      return NextResponse.json({ error: 'Keine Berechtigung (Kein Standort)' }, { status: 403 });
    }

    // Can only edit users that share at least one location?
    // Or is creating a new user assignment?
    // Let's assume: If user is already assigned to OTHER locations not in requester scope, Head cannot touch them?
    // Or simply: Head can only assign THEIR locations.

    // Prevent editing Global Admins
    if (targetUser.role === 'ADMIN') {
      return NextResponse.json({ error: 'Admins können nur von Admins bearbeitet werden' }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const { role, locationIds } = body as { role: Role; locationIds?: string[] };

    const updateData: any = {};

    // ROLE Change Security
    if (role) {
      if (!requesterIsAdmin && role === 'ADMIN') {
        return NextResponse.json({ error: 'Nicht autorisiert, Admin-Rolle zu vergeben' }, { status: 403 });
      }
      updateData.role = role as Role;
    }

    // LOCATION Change Security
    if (locationIds && Array.isArray(locationIds)) {
      if (!requesterIsAdmin) {
        // Check if all new locationIds are owned by requester
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

  // Security: Head Scope Check
  if (!requesterIsAdmin) {
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId }, include: { locations: true } });

    if (!targetUser) return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
    if (targetUser.role === 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Check if target is in one of requester's locations
    const requesterLocIds = requester?.locations.map(l => l.id) || [];
    const targetLocIds = targetUser.locations.map(l => l.id);

    const hasOverlap = targetLocIds.some(id => requesterLocIds.includes(id));
    if (!hasOverlap && targetLocIds.length > 0) { // If target has no location, maybe okay/unclaimed? But safer to deny.
      return NextResponse.json({ error: 'Nicht Ihr Zuständigkeitsbereich' }, { status: 403 });
    }
  }

  try {
    // Transactional Delete
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { customerId: targetUserId } }),
      prisma.appointment.deleteMany({ where: { barberId: targetUserId } }),
      prisma.availability.deleteMany({ where: { barberId: targetUserId } }),
      prisma.blockedTime.deleteMany({ where: { barberId: targetUserId } }),
      prisma.account.deleteMany({ where: { userId: targetUserId } }),
      prisma.session.deleteMany({ where: { userId: targetUserId } }),
      // Finally User
      prisma.user.delete({ where: { id: targetUserId } }),
    ]);

    return NextResponse.json({ message: 'Benutzer gelöscht' });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen des Benutzers' }, { status: 500 });
  }
}