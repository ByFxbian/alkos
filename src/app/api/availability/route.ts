/* eslint-disable prefer-const */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { fromZonedTime, toZonedTime, format } from "date-fns-tz";
import { logger } from "@/lib/logger";

const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    barberId: z.string(),
    serviceId: z.string(),
});

const timeZone = 'Europe/Vienna';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    logger.info("API Route /api/availability GET called", { params }); // Logging Start mit Parametern
    let response: NextResponse;

    const validation = schema.safeParse(params);
    if(!validation.success) {
        logger.warn("API Route /api/availability GET: Invalid input.", { error: validation.error });
        response = NextResponse.json({ error: 'Invalid input', details: z.treeifyError(validation.error) }, { status: 400 })
        return response;
    }
    const { date, barberId, serviceId } = validation.data;

    try {
        const requestedDate = new Date(date + 'T00:00:00');
        const dayOfWeek = requestedDate.getDay();

        const barberAvailability = await prisma.availability.findFirst({
            where: {
                barberId: barberId,
                dayOfWeek: dayOfWeek,
            },
        });

        if (!barberAvailability) {
            logger.info("API Route /api/availability GET: No availability found for barber on this day.", { date, barberId, dayOfWeek });
            return NextResponse.json([]);
        }

        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        const serviceDuration = service.duration;

        //const [startHour, startMinute] = barberAvailability.startTime.split(':').map(Number);
        //const [endHour, endMinute] = barberAvailability.endTime.split(':').map(Number);

        //const dayStart = new Date(date + `T${barberAvailability.startTime}:00`);
        //const dayEnd = new Date(date + `T${barberAvailability.endTime}:00`);

        const dayStartInVienna = fromZonedTime(`${date}T${barberAvailability.startTime}:00`, timeZone);
        const dayEndInVienna = fromZonedTime(`${date}T${barberAvailability.endTime}:00`, timeZone);

        //dayEnd.setHours(endHour, endMinute, 0, 0);
        //dayStart.setHours(startHour, startMinute, 0, 0);

        const bookedAppointments = await prisma.appointment.findMany({
            where: {
                barberId: barberId,
                startTime: {
                    gte: dayStartInVienna,
                    lt: dayEndInVienna,
                },
            },
        });

        const allPossibleSlots:Date[] = [];
        let currentTime = new Date(dayStartInVienna);

        while (currentTime < dayEndInVienna) {
            allPossibleSlots.push(new Date(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + 20); 
        }

        const nowInVienna = toZonedTime(new Date(), timeZone)
        
        const availableSlots = allPossibleSlots.filter(slotStartTime => {
            if (slotStartTime < nowInVienna) {
                return false;
            }

            const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

            if (slotEndTime > dayEndInVienna) {
                return false;
            }

            const isBooked = bookedAppointments.some(booking =>
                (slotStartTime < booking.endTime) && (slotEndTime > booking.startTime)
            );

            return !isBooked;
        });

        const formattedSlots = availableSlots.map(slot => slot.toISOString());
        logger.info("API Route /api/availability GET: Availability calculated.", { date, barberId, serviceId, numberOfSlots: formattedSlots.length });

        response = NextResponse.json(formattedSlots);
    } catch (error) {
        logger.error('API Route /api/availability GET - Availability error:', { date, barberId, serviceId, error }); // Logging Fehler
        console.error('Availability error:', error);
        response = NextResponse.json({ error: 'An error occurred while fetching availability.' }, { status: 500 });
    } finally {
        logger.info("API Route /api/availability GET: Flushing Logs.");
        await logger.flush();
    }
    if (!response!) {
        logger.error("API Route /api/availability GET: Reached end without setting a response.");
        response = NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
        await logger.flush();
    }
    return response!;
}

