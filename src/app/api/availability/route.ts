import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    barberId: z.string().cuid(),
    serviceId: z.string().cuid(),
});

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const validation = schema.safeParse(Object.fromEntries(searchParams.entries()));
    if(!validation.success) {
        return NextResponse.json({ error: 'Invalid input', details: z.treeifyError(validation.error) }, { status: 400 })
    }
    const { date, barberId, serviceId } = validation.data;

    try {
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
        });
        if(!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }
        const serviceDuration = service.duration;

        const dayStart = new Date(`${date}T08:00:00`);
        const dayEnd = new Date(`${date}T20:00:00`);

        const bookedAppointments = await prisma.appointment.findMany({
            where: {
                barberId: barberId,
                startTime: {
                    gte: dayStart,
                    lt: dayEnd,
                },
            },
        });

        const allPossibleSlots = [];
        // eslint-disable-next-line prefer-const
        let currentTime = new Date(dayStart);
        while (currentTime < dayEnd) {
            allPossibleSlots.push(new Date(currentTime));
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
        
        const availableSlots = allPossibleSlots.filter(slotStartTime => {
            if (slotStartTime < new Date()) {
                return false;
            }

            const slotEndTime = new Date(slotStartTime.getTime() + serviceDuration * 60000);

            if (slotEndTime > dayEnd) {
                return false;
            }

            const isBooked = bookedAppointments.some(booking =>
                (slotStartTime < booking.endTime) && (slotEndTime > booking.startTime)
            );

            return !isBooked;
        });

        const formattedSlots = availableSlots.map(slot => slot.toISOString());

        return NextResponse.json(formattedSlots);
    } catch (error) {
        console.error('Availability error:', error);
        return NextResponse.json({ error: 'An error occurred while fetching availability.' }, { status: 500 });
    }
}

