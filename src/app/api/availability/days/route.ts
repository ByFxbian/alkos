import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
    barberId: z.string(),
    locationId: z.string(),
    // How many days into the future to check (default 60)
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

    // For "any barber", all days with location hours are available
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

    // For a specific barber:
    // 1. Check if barber is permanently assigned to this location
    const barber = await prisma.user.findUnique({
        where: { id: barberId },
        include: { locations: { select: { id: true } } },
    });
    if (!barber) {
        return NextResponse.json({ error: 'Barber not found' }, { status: 404 });
    }

    const isPermanent = barber.locations.some(l => l.id === locationId);

    // 2. Get location opening hours (which days of the week are open)
    const locationHours = await prisma.availability.findMany({
        where: { locationId, barberId: null },
        select: { dayOfWeek: true },
    });
    const openDays = new Set(locationHours.map(h => h.dayOfWeek));

    // 3. Get all shift overrides for this barber in the date range
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

    // Build a map of date -> shift for quick lookup
    // Prisma stores DateTime as UTC midnight, so we use toLocalDateStr
    const shiftMap = new Map<string, typeof shifts[0]>();
    for (const s of shifts) {
        const dateStr = toLocalDateStr(new Date(s.date));
        shiftMap.set(dateStr, s);
    }

    // 4. Get blocked times for this barber
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
            // There's a shift override on this date
            if (shift.locationId === locationId) {
                // Barber is explicitly at THIS location today
                availableDates.push(dateStr);
            }
            // If shift is to another location, barber is NOT available here
            continue;
        }

        // No shift override — check permanent assignment + location hours
        if (isPermanent && openDays.has(dayOfWeek)) {
            // Check if fully blocked on this day
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
