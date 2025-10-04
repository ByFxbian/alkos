import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';
import CancellationEmail from '@/emails/CancellationEmail';
import { authOptions } from '@/lib/auth';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function DELETE(
  req: NextRequest,
) {
  const appointmentId = req.nextUrl.pathname.split('/').pop();
  const session = await getServerSession(authOptions);
  //const { id: appointmentId } = params;

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        customer: true,
        service: true,
      },
    });

    if (!appointment || (appointment.customerId !== session.user.id && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Zugriff verweigert' }, { status: 403 });
    }

    try {
      await resend.emails.send({
        from: 'ALKOS <contact@alkosbarber.at>', 
        to: appointment.customer.email,
        subject: 'Dein Termin wurde storniert',
        react: CancellationEmail({
          customerName: appointment.customer.name || '',
          serviceName: appointment.service.name,
          startTime: appointment.startTime,
          host: 'ALKOS'
        }),
      });
    } catch (emailError) {
      console.error('Fehler beim Senden der Stornierungs-E-Mail:', emailError);
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ message: 'Termin erfolgreich storniert' }, { status: 200 });
  } catch (error) {
    console.error('Cancellation error:', error);
    return NextResponse.json({ error: 'Fehler bei der Stornierung.' }, { status: 500 });
  }
}