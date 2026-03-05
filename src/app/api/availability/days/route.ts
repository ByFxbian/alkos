import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
    barberId: z.string(),
    locationId: z.string(),
    days: z.coerce.number().min(1).max(120).default(60),
});

/** Format a Date as YYYY-MM-DD in LOCAL time (not UTC) */
function toLocalDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

/**
 * Returns an array of date strings (YYYY-MM-DD) where the barber is available
 * at the given location. Used by the booking calendar to grey out unavailable days.
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const validation = schema.safeParse(Object.fromEntries(searchParams.entries()));
    if (!validation.success) {
        return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { barberId, locationId, days } = validation.data;


    if (barberId === 'any') {
        const locationHours = await prisma.availability.findMany({
            where: { locationId, barberId: null },
            select: { dayOfWeek: true },
        });
        const openDays = new Set(locationHours.map(h => h.dayOfWeek));

        const availableDates: string[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < days; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            if (openDays.has(d.getDay())) {
                availableDates.push(toLocalDateStr(d));
            }
        }
        return NextResponse.json({ availableDates });
    }


    const barber = await prisma.user.findUnique({
        where: { id: barberId },
        include: { locations: { select: { id: true } } },
    });
    if (!barber) {
        return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
    }

    const isPermanent = barber.locations.some(l => l.id === locationId);


    const locationHours = await prisma.availability.findMany({
        where: { locationId, barberId: null },
        select: { dayOfWeek: true },
    });
    const openDays = new Set(locationHours.map(h => h.dayOfWeek));


    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const shifts = await prisma.barberShift.findMany({
        where: {
            barberId,
            date: { gte: today, lt: endDate },
        },
    });


    const shiftMap = new Map<string, typeof shifts[0]>();
    for (const s of shifts) {
        const dateStr = toLocalDateStr(new Date(s.date));
        shiftMap.set(dateStr, s);
    }


    const blockedTimes = await prisma.blockedTime.findMany({
        where: {
            barberId,
            endTime: { gte: today },
            startTime: { lt: endDate },
        },
    });

    const availableDates: string[] = [];

    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = toLocalDateStr(d);
        const dayOfWeek = d.getDay();

        const shift = shiftMap.get(dateStr);

        if (shift) {

            if (shift.locationId === locationId) {

                availableDates.push(dateStr);
            }
            continue;
        }


        if (isPermanent && openDays.has(dayOfWeek)) {

            const dayStart = new Date(d);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(d);
            dayEnd.setHours(23, 59, 59, 999);

            const isFullyBlocked = blockedTimes.some(b =>
                b.startTime <= dayStart && b.endTime >= dayEnd
            );

            if (!isFullyBlocked) {
                availableDates.push(dateStr);
            }
        }
    }

    return NextResponse.json({ availableDates });
}
