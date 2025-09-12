import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if(!session || !["ADMIN", "FRISEUR"].includes(session.user.role)) {
        return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
    }

    const { appointmentId } = await req.json();
    if(!appointmentId) {
        return NextResponse.json({ message: "Termin-ID Fehlt." }, { status: 400 });
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

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