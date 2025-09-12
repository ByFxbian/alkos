import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'Token fehlt' }, { status: 400 });
    }

    const stampToken = await prisma.stampToken.findUnique({
      where: { token },
      include: {
        appointment: {
          select: { customerId: true },
        },
      },
    });


    if (!stampToken || !stampToken.appointment || stampToken.redeemedAt || new Date() > stampToken.expiresAt) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener QR-Code' }, { status: 400 });
    }

    if (stampToken.appointment.customerId !== session.user.id) {
        return NextResponse.json({ error: 'Dieser Stempel gehört nicht dir.' }, { status: 403 });
    }

    const customerIdToUpdate = stampToken.appointment.customerId;

    await prisma.$transaction(async (tx) => {
      await tx.stampToken.update({
        where: { id: stampToken.id },
        data: { redeemedAt: new Date() },
      });

      const user = await tx.user.findUnique({ where: { id: customerIdToUpdate } });
      if (user) {
        const newCount = user.completedAppointments + 1;
        await tx.user.update({
          where: { id: customerIdToUpdate },
          data: {
            completedAppointments: newCount,
            hasFreeAppointment: newCount >= 15 ? true : user.hasFreeAppointment,
          },
        });
      }
    });

    return NextResponse.json({ message: 'Stempel erfolgreich erhalten!' });
  } catch (error) {
    console.error('Redeem stamp error:', error);
    return NextResponse.json({ error: 'Fehler beim Einlösen des Stempels.' }, { status: 500 });
  }
}