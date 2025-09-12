import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import CancellationEmail from '@/emails/CancellationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function DELETE(
  _req: NextRequest,
  context: { params: unknown }
) {
  const { params } = context as { params: { id: string } };
  const session = await getServerSession(authOptions);
  const { id: appointmentId } = params;

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    // 1. Finde den zu löschenden Termin
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
      },
    });

    // 2. Sicherheits-Check: Gehört der Termin dem eingeloggten User?
    if (!appointment || (appointment.customerId !== session.user.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    }

    try {
      await resend.emails.send({
        from: 'Alkos <no-reply@pulsefeed.de>', 
        to: appointment.customer.email,
        subject: 'Dein Termin wurde storniert',
        react: CancellationEmail({
          customerName: appointment.customer.name || '',
          serviceName: appointment.service.name,
          startTime: appointment.startTime,
          host: 'Alkos Barber'
        }),
      });
    } catch (emailError) {
      console.error('Fehler beim Senden der Stornierungs-E-Mail:', emailError);
    }

    // 3. Wenn alles passt, lösche den Termin
    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ message: 'Termin erfolgreich storniert' }, { status: 200 });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Fehler bei der Stornierung.' }, { status: 500 });
  }
}