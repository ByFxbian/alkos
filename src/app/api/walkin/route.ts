import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { startOfDay, endOfDay, format } from 'date-fns';

const timeZone = 'Europe/Vienna';
const WALK_IN_USER_EMAIL = 'walkin@alkosbarber.at';

interface AvailableSlot {
    slot: Date;
    barberId: string;
    barberName: string;
}

async function findNextAvailableSlot(serviceId: string): Promise<AvailableSlot | null> {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return null;

    const serviceDuration = service.duration;
    const now = new Date();
    const nowInVienna = toZonedTime(now, timeZone);
    const today = startOfDay(nowInVienna);
    const dateStr = format(today, 'yyyy-MM-dd');
    const dayOfWeek = today.getDay();

    const barbers = await prisma.user.findMany({
        where: { role: { in: ['BARBER', 'HEADOFBARBER'] } },
        select: { id: true, name: true },
    });

    const allAvailableSlots: AvailableSlot[] = [];

    for (const barber of barbers) {
        const availability = await prisma.availability.findFirst({
            where: { barberId: barber.id, dayOfWeek },
        });

        if (!availability) continue;

        const availabilityStart = fromZonedTime(`${dateStr}T${availability.startTime}:00`, timeZone);
        const availabilityEnd = fromZonedTime(`${dateStr}T${availability.endTime}:00`, timeZone);

        const bookedAppointments = await prisma.appointment.findMany({
            where: {
                barberId: barber.id,
                startTime: { gte: availabilityStart, lt: availabilityEnd },
            },
        });

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

        let currentTime = new Date(availabilityStart);
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
                allAvailableSlots.push({
                    slot: slotStart,
                    barberId: barber.id,
                    barberName: barber.name || 'Unbekannt',
                });
            }

            currentTime.setMinutes(currentTime.getMinutes() + 20);
        }
    }

    allAvailableSlots.sort((a, b) => a.slot.getTime() - b.slot.getTime());
    return allAvailableSlots[0] || null;
}

export async function POST(req: Request) {
    try {
        const { customerName, serviceId } = await req.json();

        if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
            return NextResponse.json({ error: 'Bitte gib deinen Namen ein (mind. 2 Zeichen)' }, { status: 400 });
        }

        if (!serviceId || typeof serviceId !== 'string') {
            return NextResponse.json({ error: 'Bitte wähle einen Service' }, { status: 400 });
        }

        const walkInUser = await prisma.user.findUnique({
            where: { email: WALK_IN_USER_EMAIL },
        });

        if (!walkInUser) {
            console.error('Walk-In user not found');
            return NextResponse.json({ error: 'Walk-In System nicht konfiguriert' }, { status: 500 });
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) {
            return NextResponse.json({ error: 'Service nicht gefunden' }, { status: 404 });
        }

        const nextSlot = await findNextAvailableSlot(serviceId);
        if (!nextSlot) {
            return NextResponse.json({ error: 'Heute sind leider keine Termine mehr frei' }, { status: 404 });
        }

        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                barberId: nextSlot.barberId,
                startTime: nextSlot.slot,
            },
        });

        if (existingAppointment) {
            return NextResponse.json({ error: 'Dieser Slot wurde gerade gebucht. Bitte versuche es erneut.' }, { status: 409 });
        }

        const appointmentEndTime = new Date(nextSlot.slot.getTime() + service.duration * 60000);

        const newAppointment = await prisma.appointment.create({
            data: {
                startTime: nextSlot.slot,
                endTime: appointmentEndTime,
                customerId: walkInUser.id,
                barberId: nextSlot.barberId,
                serviceId: serviceId,
                walkInName: customerName.trim(),
                isFree: false,
            },
            include: {
                service: true,
                barber: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({
            success: true,
            appointment: {
                id: newAppointment.id,
                customerName: customerName.trim(),
                startTime: newAppointment.startTime.toISOString(),
                endTime: newAppointment.endTime.toISOString(),
                serviceName: newAppointment.service.name,
                barberName: newAppointment.barber.name || 'Unbekannt',
            },
        });
    } catch (error) {
        console.error('Error creating Walk-In appointment:', error);
        return NextResponse.json({ error: 'Fehler beim Erstellen des Termins' }, { status: 500 });
    }
}
