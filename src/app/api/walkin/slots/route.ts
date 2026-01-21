import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, format } from 'date-fns';

const timeZone = 'Europe/Vienna';

interface BarberSlot {
    barberId: string;
    barberName: string;
    barberImage: string | null;
    slot: string; // ISO string
    isEarliest: boolean;
}

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const serviceId = searchParams.get('serviceId');

        if (!serviceId) {
            return NextResponse.json({ error: 'Service ID required' }, { status: 400 });
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        }

        const serviceDuration = service.duration;
        const now = new Date();
        const nowInVienna = toZonedTime(now, timeZone);
        const today = startOfDay(nowInVienna);
        const dateStr = format(today, 'yyyy-MM-dd');
        const dayOfWeek = today.getDay();

        // Get all barbers
        const barbers = await prisma.user.findMany({
            where: { role: { in: ['BARBER', 'HEADOFBARBER'] } },
            select: { id: true, name: true, image: true },
        });

        const availableSlots: BarberSlot[] = [];

        for (const barber of barbers) {
            // Get barber's availability for today
            const availability = await prisma.availability.findFirst({
                where: { barberId: barber.id, dayOfWeek },
            });

            if (!availability) continue;

            const availabilityStart = fromZonedTime(`${dateStr}T${availability.startTime}:00`, timeZone);
            const availabilityEnd = fromZonedTime(`${dateStr}T${availability.endTime}:00`, timeZone);

            // Get booked appointments
            const bookedAppointments = await prisma.appointment.findMany({
                where: {
                    barberId: barber.id,
                    startTime: { gte: availabilityStart, lt: availabilityEnd },
                },
            });

            // Get blocked times
            const blockedTimes = await prisma.blockedTime.findMany({
                where: {
                    barberId: barber.id,
                    OR: [
                        { startTime: { gte: startOfDay(availabilityStart), lt: endOfDay(availabilityStart) } },
                        { endTime: { gte: startOfDay(availabilityStart), lt: endOfDay(availabilityStart) } },
                        { startTime: { lte: startOfDay(availabilityStart) }, endTime: { gte: endOfDay(availabilityStart) } },
                    ],
                },
            });

            // Iterate 20-min slots to find the FIRST available one for this barber
            let currentTime = new Date(availabilityStart);
            let foundSlot: Date | null = null;

            while (currentTime < availabilityEnd) {
                const slotStart = new Date(currentTime);
                const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

                if (slotStart < now) {
                    currentTime.setMinutes(currentTime.getMinutes() + 20);
                    continue;
                }

                if (slotEnd > availabilityEnd) {
                    break;
                }

                const isBooked = bookedAppointments.some(
                    (booking) => slotStart < booking.endTime && slotEnd > booking.startTime
                );

                const isBlocked = blockedTimes.some(
                    (block) => slotStart < block.endTime && slotEnd > block.startTime
                );

                if (!isBooked && !isBlocked) {
                    foundSlot = slotStart;
                    break; // Found the earliest slot for this barber
                }

                currentTime.setMinutes(currentTime.getMinutes() + 20);
            }

            if (foundSlot) {
                availableSlots.push({
                    barberId: barber.id,
                    barberName: barber.name || 'Unbekannt',
                    barberImage: barber.image,
                    slot: foundSlot.toISOString(),
                    isEarliest: false, // Will calculate later
                });
            }
        }

        if (availableSlots.length > 0) {
            // Sort to find absolute earliest
            availableSlots.sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime());
            availableSlots[0].isEarliest = true;
        }

        return NextResponse.json({ slots: availableSlots });

    } catch (error) {
        console.error('Error fetching walkin slots:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
