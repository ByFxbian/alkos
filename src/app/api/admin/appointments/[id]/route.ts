import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id: appointmentId } = params;

  // Strikte Prüfung: Nur Admins dürfen diese Route nutzen
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }

  try {
    // Finde den Termin, um ggf. eine Stornierungs-Mail zu senden (optional)
    const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return NextResponse.json({ error: 'Termin nicht gefunden' }, { status: 404 });
    }
    
    // Lösche den Termin
    await prisma.appointment.delete({ where: { id: appointmentId } });

    // Hier könnte man auch eine E-Mail an den Kunden senden, dass sein Termin vom Admin storniert wurde.

    return NextResponse.json({ message: 'Termin erfolgreich vom Admin gelöscht' });
  } catch (error) {
    console.error('Admin appointment deletion error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Termins.' }, { status: 500 });
  }
}