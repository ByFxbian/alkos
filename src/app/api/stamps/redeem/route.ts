import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if(!session || !session.user) {
        return NextResponse.json({ message: "Nicht autorisiert." }, { status: 401 });
    }

    const { token } = await req.json();
    if(!token) {
        return NextResponse.json({ message: "Token fehlt." }, { status: 400 });
    }

    try {
        const stampToken = await prisma.stampToken.findUnique({
            where: { token },
        });

        if(!stampToken || stampToken.redeemedAt || new Date() > stampToken.expiresAt) {
            return NextResponse.json({ message: "Ungültiger oder abgelaufener QR-Code." }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.stampToken.update({
                where: { id: stampToken.id },
                data: { redeemedAt: new Date() },
            });

            const user = await tx.user.findUnique({ where: { id: session.user.id } });
            if(user) {
                const newCount = user.completedAppointments + 1;
                await tx.user.update({
                    where: { id: session.user.id },
                    data: {
                        completedAppointments: newCount,
                        hasFreeAppointment: newCount >= 15 ? true : user.hasFreeAppointment,
                    },
                });
            }
        });
        return NextResponse.json({ message: "Stempel erfolgreich eingelöst." });
    } catch {
        return NextResponse.json({ message: "Fehler beim Einlösen des Stempels." }, { status: 500 });
    }
}