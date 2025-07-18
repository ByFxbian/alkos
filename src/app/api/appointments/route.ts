import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { barberId, serviceId, startTime } = body;
    const customerId = session.user.id;

    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 });
    }

    const appointmentStartTime = new Date(startTime);
    const appointmentEndTime = new Date(appointmentStartTime.getTime() + service.duration * 60000);

    const newAppointment = await prisma.appointment.create({
      data: {
        startTime: appointmentStartTime,
        endTime: appointmentEndTime,
        customerId,
        barberId,
        serviceId,
      },
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'Fehler bei der Terminerstellung.' }, { status: 500 });
  }
}