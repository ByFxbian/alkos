/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse,NextRequest} from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const targetUserId = params.id;

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (session.user.id === targetUserId) {
    return NextResponse.json({ error: 'Eigene Rolle kann nicht geändert werden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { role } = body as { role: Role };

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: { role },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Rolle' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const targetUserId = params.id;

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  if (session.user.id === targetUserId) {
    return NextResponse.json({ error: 'Man kann sich nicht selbst löschen' }, { status: 403 });
  }

  try {
    await prisma.appointment.deleteMany({ where: { customerId: targetUserId } });
    await prisma.appointment.deleteMany({ where: { barberId: targetUserId } });
    await prisma.availability.deleteMany({ where: { barberId: targetUserId } });

    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ message: 'Benutzer gelöscht' });
  } catch (error) {
    return NextResponse.json({ error: 'Fehler beim Löschen des Benutzers' }, { status: 500 });
  }
}