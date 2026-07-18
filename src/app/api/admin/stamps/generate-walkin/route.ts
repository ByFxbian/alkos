import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';

const WALK_IN_USER_EMAIL = 'walkin@alkosbarber.at';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "BARBER", "HEADOFBARBER"].includes(session.user.role)) {
        return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
    }

    try {
        const { barberId, serviceId, locationId } = await req.json();
        
        if (!barberId || !serviceId) {
            return NextResponse.json({ error: 'Mitarbeiter und Dienstleistung sind erforderlich.' }, { status: 400 });
        }

        // Find the Walk-In system user
        const walkInUser = await prisma.user.findUnique({
            where: { email: WALK_IN_USER_EMAIL },
        });

        if (!walkInUser) {
            return NextResponse.json({ error: 'Walk-In Systemnutzer wurde nicht gefunden.' }, { status: 500 });
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            return NextResponse.json({ error: 'Dienstleistung nicht gefunden.' }, { status: 404 });
        }

        // Create a walkin dummy appointment for the walkInUser
        const now = new Date();
        const endTime = new Date(now.getTime() + service.duration * 60000);

        const appointment = await prisma.appointment.create({
            data: {
                startTime: now,
                endTime: endTime,
                customerId: walkInUser.id,
                barberId: barberId,
                serviceId: serviceId,
                locationId: locationId || null,
                walkInName: "Walk-In (Ausstehend)",
                isFree: false,
            }
        });

        // Generate temporary stamp token expiring in 10 minutes
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        const stampToken = await prisma.stampToken.create({
            data: {
                token,
                appointmentId: appointment.id,
                expiresAt,
            },
        });

        return NextResponse.json({ token: stampToken.token });
    } catch (error) {
        console.error('Error generating walkin stamp:', error);
        return NextResponse.json({ error: 'Fehler beim Erstellen des Walk-In Stempels.' }, { status: 500 });
    }
}
