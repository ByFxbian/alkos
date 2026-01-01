/* eslint-disable prefer-const */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";
import { logger } from "@/lib/logger";

const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    barberId: z.string(),
    serviceId: z.string(),
    locationId: z.string().optional(),
});

const timeZone = 'Europe/Vienna';

async function getSlotsForBarber(barberId: string, date: string, serviceDuration: number) {
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    const barberAvailability = await prisma.availability.findFirst({
        where: {
            barberId: barberId,
            dayOfWeek: dayOfWeek,
        },
    });

    if (!barberAvailability) return [];

    const availabilityStartInVienna = fromZonedTime(`${date}T${barberAvailability.startTime}:00`, timeZone);
    const availabilityEndInVienna = fromZonedTime(`${date}T${barberAvailability.endTime}:00`, timeZone);

    const dayStart = startOfDay(availabilityStartInVienna);
    const dayEnd = endOfDay(availabilityStartInVienna);

    const bookedAppointments = await prisma.appointment.findMany({
        where: {
            barberId: barberId,
            startTime: {
                gte: availabilityStartInVienna,
                lt: availabilityEndInVienna,
            },
        },
    });

    const blockedTimes = await prisma.blockedTime.findMany({
        where: {
            barberId: barberId,
            OR: [
                { startTime: { gte: dayStart, lt: dayEnd } },
                { endTime: { gte: dayStart, lt: dayEnd } },
                { startTime: { lte: dayStart }, endTime: { gte: dayEnd } }
            ]
        }
    });

    const slots: Date[] = [];
    let currentTime = new Date(availabilityStartInVienna);

    while (currentTime < availabilityEndInVienna) {
        slots.push(new Date(currentTime));
        currentTime.setMinutes(currentTime.getMinutes() + 20);
    }

    const nowInVienna = toZonedTime(new Date(), timeZone)

    return slots.filter(slotStartTime => {
        if (slotStartTime < nowInVienna) return false;

        const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

        if (slotEndTime > availabilityEndInVienna) return false;

        const isBooked = bookedAppointments.some(booking =>
            (slotStartTime < booking.endTime) && (slotEndTime > booking.startTime)
        );

        const isBlocked = blockedTimes.some(block =>
            (slotStartTime < block.endTime) && (slotEndTime > block.startTime)
        );

        return !isBooked && !isBlocked;
    });
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    let response: NextResponse;

    const validation = schema.safeParse(params);
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: z.treeifyError(validation.error) }, { status: 400 });
    }
    const { date, barberId, serviceId, locationId } = validation.data;

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        let targetBarberIds: string[] = [];

        if (barberId === 'any') {
            if (!locationId) {
                return NextResponse.json({ error: 'Location ID required for random barber selection' }, { status: 400 });
            }
            const barbers = await prisma.user.findMany({
                where: {
                    locations: { some: { id: locationId } },
                    role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] }
                },
                select: { id: true }
            });
            targetBarberIds = barbers.map(b => b.id);
        } else {
            targetBarberIds = [barberId];
        }

        const allSlotsSet = new Set<string>();

        for (const bId of targetBarberIds) {
            const slots = await getSlotsForBarber(bId, date, service.duration);
            slots.forEach(s => allSlotsSet.add(s.toISOString()));
        }

        const sortedSlots = Array.from(allSlotsSet).sort();

        response = NextResponse.json(sortedSlots);
    } catch (error) {
        logger.error('API Route /api/availability GET - Availability error:', { date, barberId, serviceId, error });
        response = NextResponse.json({ error: 'An error occurred while fetching availability.' }, { status: 500 });
    } finally {
        await logger.flush();
    }
    return response!;
}

