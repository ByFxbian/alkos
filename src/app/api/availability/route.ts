/* eslint-disable prefer-const */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { startOfDay, endOfDay } from "date-fns";
import { logger } from "@/lib/logger";

const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    barberId: z.string(),
    serviceId: z.string(),
    locationId: z.string().optional(),
});

const timeZone = 'Europe/Vienna';

/**
 * Get available time slots for a barber at a location on a given date.
 * 
 * Uses location opening hours (Availability with barberId=null) and checks
 * for BarberShift overrides on specific dates, then filters out booked
 * appointments and blocked times.
 */
async function getSlotsForBarber(barberId: string, date: string, serviceDuration: number, locationId?: string) {
    const requestedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = requestedDate.getDay();

    let startTime: string | undefined;
    let endTime: string | undefined;


    if (locationId) {
        const shift = await prisma.barberShift.findUnique({
            where: {
                barberId_date: {
                    barberId: barberId,
                    date: requestedDate,
                }
            }
        });

        if (shift) {
            if (shift.locationId === locationId) {

                startTime = shift.startTime;
                endTime = shift.endTime;
            } else {

                return [];
            }
        }
    }


    if (!startTime || !endTime) {
        if (!locationId) return [];

        const locationHours = await prisma.availability.findFirst({
            where: {
                locationId: locationId,
                dayOfWeek: dayOfWeek,
                barberId: null, // Location-level hours
            },
        });

        if (!locationHours) return [];

        startTime = locationHours.startTime;
        endTime = locationHours.endTime;
    }

    const availabilityStartInVienna = fromZonedTime(`${date}T${startTime}:00`, timeZone);
    const availabilityEndInVienna = fromZonedTime(`${date}T${endTime}:00`, timeZone);

    const dayStart = startOfDay(availabilityStartInVienna);
    const dayEnd = endOfDay(availabilityStartInVienna);

    const [bookedAppointments, blockedTimes] = await Promise.all([
        prisma.appointment.findMany({
            where: {
                barberId: barberId,
                startTime: {
                    gte: availabilityStartInVienna,
                    lt: availabilityEndInVienna,
                },
            },
        }),
        prisma.blockedTime.findMany({
            where: {
                barberId: barberId,
                OR: [
                    { startTime: { gte: dayStart, lt: dayEnd } },
                    { endTime: { gte: dayStart, lt: dayEnd } },
                    { startTime: { lte: dayStart }, endTime: { gte: dayEnd } }
                ]
            }
        }),
    ]);

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

            const requestedDate = new Date(date + 'T00:00:00');


            const [permanentBarbers, shiftBarbers] = await Promise.all([
                prisma.user.findMany({
                    where: {
                        userLocations: { some: { locationId: locationId, isBookable: true } },
                        role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
                        isBlocked: false,
                    },
                    select: { id: true }
                }),
                prisma.barberShift.findMany({
                    where: {
                        locationId: locationId,
                        date: requestedDate,
                    },
                    select: { barberId: true }
                })
            ]);


            const overriddenBarbers = await prisma.barberShift.findMany({
                where: {
                    date: requestedDate,
                    locationId: { not: locationId },
                },
                select: { barberId: true }
            });
            const overriddenBarberIds = new Set(overriddenBarbers.map(b => b.barberId));

            const barberIdSet = new Set<string>();

            shiftBarbers.forEach(b => barberIdSet.add(b.barberId));

            permanentBarbers.forEach(b => {
                if (!overriddenBarberIds.has(b.id)) {
                    barberIdSet.add(b.id);
                }
            });

            targetBarberIds = Array.from(barberIdSet);
        } else {
            targetBarberIds = [barberId];
        }

        const allSlotsSet = new Set<string>();
        const allBarberSlots = await Promise.all(
            targetBarberIds.map((bId) => getSlotsForBarber(bId, date, service.duration, locationId))
        );
        allBarberSlots.flat().forEach((slot) => allSlotsSet.add(slot.toISOString()));

        let sortedSlots = Array.from(allSlotsSet).sort();

        if (locationId) {
            const location = await prisma.location.findUnique({
                where: { id: locationId }
            });
            if (location?.slug === 'baden') {
                const badenStartDateTime = new Date('2026-03-07T12:00:00+01:00');
                sortedSlots = sortedSlots.filter(s => new Date(s) >= badenStartDateTime);
            }
        }

        response = NextResponse.json(sortedSlots);
    } catch (error) {
        logger.error('API Route /api/availability GET - Availability error:', { date, barberId, serviceId, error });
        response = NextResponse.json({ error: 'An error occurred while fetching availability.' }, { status: 500 });
    } finally {
        await logger.flush();
    }
    return response!;
}
