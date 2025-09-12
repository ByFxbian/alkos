import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id: appointmentId } = params;

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
  }

  try {
    /*const appointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      return NextResponse.json({ error: 'Termin nicht gefunden' }, { status: 404 });
    }
    
    await prisma.appointment.delete({ where: { id: appointmentId } });*/
    await prisma.$transaction(async (tx) => {
      await tx.stampToken.deleteMany({
        where: { appointmentId: appointmentId },
      });

      await tx.appointment.delete({
        where: { id: appointmentId },
      });
    });


    return NextResponse.json({ message: 'Termin erfolgreich vom Admin gelöscht' });
  } catch (error) {
    console.error('Admin appointment deletion error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen des Termins.' }, { status: 500 });
  }
}