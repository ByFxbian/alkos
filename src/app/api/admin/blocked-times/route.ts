import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import z from "zod";
import { prisma } from '@/lib/prisma';

const createSchema = z.object({
    startTime: z.iso.datetime(),
    endTime: z.iso.datetime(),
    reason: z.string().optional(),
    barberId: z.string().optional(),
});

export async function POST(req: Request) {
    logger.info("API Route /api/admin/blocked-times POST called");
    let response: NextResponse;
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'BARBER', 'HEADOFBARBER'].includes(session.user.role)) {
        logger.warn("API Route /api/admin/blocked-times POST: Unauthorized.");
        response = NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        return response;
    }
    logger.info("API Route /api/admin/blocked-times POST: User authorized.", { userId: session.user.id, role: session.user.role });

    try {
        const body = await req.json();

        const validation = createSchema.safeParse(body);
        if (!validation.success) {
            logger.warn("API Route /api/admin/blocked-times POST: Invalid input.", { error: validation.error });
            response = NextResponse.json({ error: 'Ungültige Eingabe', details: validation.error.format() }, { status: 400 });
            return response;
        }

        const { startTime, endTime, reason, barberId: adminSpecifiedBarberId } = validation.data;

        let targetBarberId: string;
        const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);

        if (isAdminOrHead && adminSpecifiedBarberId) {
            // Admin/Head blockiert Zeit für einen anderen Barber
            targetBarberId = adminSpecifiedBarberId;
            logger.info(`API Route /api/admin/blocked-times POST: Admin ${session.user.id} is blocking time for user ${targetBarberId}.`);
        } else {
            // Barber blockiert für sich selbst (oder Admin/Head für sich selbst)
            targetBarberId = session.user.id;
        }

        const newBlockedTime = await prisma.blockedTime.create({
            data: {
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                reason,
                barberId: targetBarberId,
            },
        });

        logger.info("API Route /api/admin/blocked-times POST: Blocked time created.", { id: newBlockedTime.id, userId: targetBarberId });
        response = NextResponse.json(newBlockedTime, { status: 201 });
    } catch (error) {
        logger.error('API Route /api/admin/blocked-times POST - Error:', { error });
        response = NextResponse.json({ error: 'Fehler beim Erstellen der Block-Zeit.' }, { status: 500 });
    } finally {
        logger.info("API Route /api/admin/blocked-times POST: Flushing logs.");
        await logger.flush();
    }
    return response!;
}