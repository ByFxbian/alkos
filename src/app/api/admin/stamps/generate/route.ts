import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { endOfDay } from "date-fns";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if(!session || !["ADMIN", "BARBER", "HEADOFBARBER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
    }

    const { appointmentId } = await req.json();
    if(!appointmentId) {
        return NextResponse.json({ message: "Termin-ID Fehlt." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, barberId: true, locationId: true },
    });
    if (!appointment) {
        return NextResponse.json({ error: 'Termin nicht gefunden.' }, { status: 404 });
    }

    if (session.user.role === 'BARBER' && appointment.barberId !== session.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (session.user.role === 'HEADOFBARBER') {
        const requester = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { userLocations: { select: { locationId: true } } },
        });
        const allowedLocationIds = requester?.userLocations.map((ul) => ul.locationId) || [];
        if (!appointment.locationId || !allowedLocationIds.includes(appointment.locationId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const existingToken = await prisma.stampToken.findFirst({
        where: { appointmentId: appointmentId }
    });

    if (existingToken) {

        if (existingToken.redeemedAt) {
        return NextResponse.json({ error: 'Dieser Stempel wurde bereits eingelöst.' }, { status: 409 });
        }
        return NextResponse.json({ token: existingToken.token });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = endOfDay(new Date());

    try {
        const stampToken = await prisma.stampToken.create({
            data: {
                token,
                appointmentId,
                expiresAt,
            },
        });

        return NextResponse.json({ token: stampToken.token });
    } catch {
        return NextResponse.json({ error: 'Token bereits erstellt.' }, { status: 409 });
    }
}
