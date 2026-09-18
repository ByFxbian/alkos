import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

const timeZone = 'Europe/Vienna';

async function processAutoCheckOuts() {
    try {
        const now = new Date();

        // Find all check-ins without a checkOutAt
        const openCheckIns = await prisma.employeeCheckIn.findMany({
            where: { checkOutAt: null },
            include: {
                location: true,
            },
        });

        for (const record of openCheckIns) {
            const checkInVienna = toZonedTime(record.checkInAt, timeZone);
            const dateStr = format(checkInVienna, 'yyyy-MM-dd');
            const dayOfWeek = checkInVienna.getDay();

            // 1. Check shift for this date & barber
            const shift = await prisma.barberShift.findFirst({
                where: {
                    barberId: record.barberId,
                    date: record.date,
                },
            });

            let closingTimeStr = shift?.endTime || null;

            // 2. If no shift, check location availability for this location & dayOfWeek
            if (!closingTimeStr) {
                const avail = await prisma.availability.findFirst({
                    where: {
                        locationId: record.locationId,
                        dayOfWeek: dayOfWeek,
                        barberId: null,
                    },
                });
                closingTimeStr = avail?.endTime || '19:00';
            }

            // Construct closing date/time in Vienna timezone
            const closingTimeViennaUtc = fromZonedTime(`${dateStr}T${closingTimeStr}:00`, timeZone);
            
            // Cutoff = closingTime + 60 minutes (1 hour after salon/shift close)
            const cutoffUtc = new Date(closingTimeViennaUtc.getTime() + 60 * 60 * 1000);

            if (now.getTime() > cutoffUtc.getTime()) {
                // Auto check out! Set checkOutAt to cutoffUtc and isAutoCheckOut to true
                await prisma.employeeCheckIn.update({
                    where: { id: record.id },
                    data: {
                        checkOutAt: cutoffUtc,
                        isAutoCheckOut: true,
                        note: `Automatisch ausgecheckt (Ladenschluss ${closingTimeStr} Uhr überschritten)`,
                    },
                });
            }
        }
    } catch (err) {
        console.error('Error processing auto check-outs:', err);
    }
}

async function getExpectedTimes(barberId: string, locationId: string, date: Date, viennaNow: Date) {
    const dayOfWeek = viennaNow.getDay();

    // 1. Shift
    const shift = await prisma.barberShift.findFirst({
        where: { barberId, date },
    });

    if (shift && shift.startTime && shift.endTime) {
        return { startTime: shift.startTime, endTime: shift.endTime, label: 'Schicht' };
    }

    // 2. Barber-specific Availability
    const barberAvail = await prisma.availability.findFirst({
        where: {
            locationId,
            dayOfWeek,
            barberId,
        },
    });

    if (barberAvail && barberAvail.startTime && barberAvail.endTime) {
        return { startTime: barberAvail.startTime, endTime: barberAvail.endTime, label: 'Arbeitszeit' };
    }

    // 3. Location Opening Hours
    const avail = await prisma.availability.findFirst({
        where: {
            locationId,
            dayOfWeek,
            barberId: null,
        },
    });

    if (avail && avail.startTime && avail.endTime) {
        return { startTime: avail.startTime, endTime: avail.endTime, label: 'Öffnungszeiten' };
    }

    // 4. Fallback
    return { startTime: '10:00', endTime: '19:00', label: 'Standard' };
}

export async function POST(req: Request) {
    try {
        // First run auto check-out processor to clean up past open check-ins
        await processAutoCheckOuts();

        const ip = getClientIp(req);
        const rl = checkRateLimit(`checkin-pin:${ip}`, { limit: 15, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz.' }, { status: 429 });
        }

        const { pin, locationId, action } = await req.json();

        if (!pin || typeof pin !== 'string' || pin.length < 4) {
            return NextResponse.json({ error: 'Bitte gib deinen gültigen PIN ein (mind. 4 Stellen).' }, { status: 400 });
        }

        const now = new Date();
        const viennaNow = toZonedTime(now, timeZone);
        const todayDateStr = format(viennaNow, 'yyyy-MM-dd');
        const todayDate = new Date(`${todayDateStr}T00:00:00.000Z`);

        // Find barber matching the PIN
        const barbersWithPin = await prisma.user.findMany({
            where: {
                role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
                barberPin: { not: null },
            },
            select: {
                id: true,
                name: true,
                image: true,
                role: true,
                barberPin: true,
                userLocations: { select: { locationId: true } },
            },
        });

        let matchedBarber = null;
        for (const b of barbersWithPin) {
            if (!b.barberPin) continue;
            const isMatch = await bcrypt.compare(pin, b.barberPin);
            if (isMatch) {
                matchedBarber = b;
                break;
            }
        }

        if (!matchedBarber) {
            return NextResponse.json({ error: 'Falscher PIN.' }, { status: 401 });
        }

        let targetLocationId = locationId;
        if (!targetLocationId && matchedBarber.userLocations.length > 0) {
            targetLocationId = matchedBarber.userLocations[0].locationId;
        }

        if (!targetLocationId) {
            const firstLoc = await prisma.location.findFirst({ select: { id: true } });
            targetLocationId = firstLoc?.id || '';
        }

        // Check if there is an existing check-in today
        const existingCheckIn = await prisma.employeeCheckIn.findUnique({
            where: {
                barberId_date: {
                    barberId: matchedBarber.id,
                    date: todayDate,
                },
            },
            include: {
                location: { select: { name: true } },
            },
        });

        // HANDLE CHECK-OUT REQUEST
        if (action === 'check-out') {
            if (!existingCheckIn) {
                return NextResponse.json({ error: 'Du hast dich heute noch nicht eingecheckt.' }, { status: 400 });
            }

            if (existingCheckIn.checkOutAt) {
                const checkOutVienna = toZonedTime(existingCheckIn.checkOutAt, timeZone);
                return NextResponse.json({
                    alreadyCheckedOut: true,
                    barberName: matchedBarber.name || 'Mitarbeiter',
                    barberImage: matchedBarber.image,
                    checkOutAt: existingCheckIn.checkOutAt.toISOString(),
                    message: `Bereits heute um ${format(checkOutVienna, 'HH:mm')} Uhr ausgecheckt.`,
                });
            }

            // Perform check-out
            const updatedCheckIn = await prisma.employeeCheckIn.update({
                where: { id: existingCheckIn.id },
                data: {
                    checkOutAt: now,
                    isAutoCheckOut: false,
                },
                include: { location: { select: { name: true } } },
            });

            const checkOutVienna = toZonedTime(updatedCheckIn.checkOutAt!, timeZone);

            return NextResponse.json({
                success: true,
                action: 'check-out',
                barberName: matchedBarber.name || 'Mitarbeiter',
                barberImage: matchedBarber.image,
                checkInAt: updatedCheckIn.checkInAt.toISOString(),
                checkOutAt: updatedCheckIn.checkOutAt!.toISOString(),
                isAutoCheckOut: false,
                locationName: updatedCheckIn.location.name,
                message: `Erfolgreich um ${format(checkOutVienna, 'HH:mm')} Uhr ausgecheckt. Schönen Feierabend!`,
            });
        }

        // HANDLE CHECK-IN REQUEST OR PIN SUBMISSION
        if (existingCheckIn) {
            const checkInVienna = toZonedTime(existingCheckIn.checkInAt, timeZone);
            const checkOutVienna = existingCheckIn.checkOutAt ? toZonedTime(existingCheckIn.checkOutAt, timeZone) : null;

            return NextResponse.json({
                alreadyCheckedIn: true,
                canCheckOut: !existingCheckIn.checkOutAt,
                isAlreadyCheckedOut: !!existingCheckIn.checkOutAt,
                barberId: matchedBarber.id,
                barberName: matchedBarber.name || 'Mitarbeiter',
                barberImage: matchedBarber.image,
                checkInAt: existingCheckIn.checkInAt.toISOString(),
                checkOutAt: existingCheckIn.checkOutAt ? existingCheckIn.checkOutAt.toISOString() : null,
                isAutoCheckOut: existingCheckIn.isAutoCheckOut,
                status: existingCheckIn.status,
                delayMinutes: existingCheckIn.delayMinutes,
                locationName: existingCheckIn.location.name,
                message: existingCheckIn.checkOutAt
                    ? `Heute eingecheckt um ${format(checkInVienna, 'HH:mm')} Uhr & ausgecheckt um ${format(checkOutVienna!, 'HH:mm')} Uhr.`
                    : `Bereits heute um ${format(checkInVienna, 'HH:mm')} Uhr eingecheckt.`,
            });
        }

        // Calculate expected start time & punctuality based on BarberShift or Location Availability
        const expectedTimes = await getExpectedTimes(matchedBarber.id, targetLocationId, todayDate, viennaNow);
        
        const expectedStartUtc = fromZonedTime(`${todayDateStr}T${expectedTimes.startTime}:00`, timeZone);

        const diffMs = now.getTime() - expectedStartUtc.getTime();
        const diffMinutes = Math.round(diffMs / 60000);

        let status = 'ON_TIME';
        let delayMinutes = 0;

        // Grace period of 2 minutes
        if (diffMinutes > 2) {
            status = 'LATE';
            delayMinutes = diffMinutes;
        } else {
            status = 'ON_TIME';
            delayMinutes = 0;
        }

        const checkInRecord = await prisma.employeeCheckIn.create({
            data: {
                barberId: matchedBarber.id,
                locationId: targetLocationId,
                checkInAt: now,
                date: todayDate,
                status: status,
                delayMinutes: delayMinutes,
            },
            include: {
                location: { select: { name: true } },
            },
        });

        return NextResponse.json({
            success: true,
            action: 'check-in',
            barberId: matchedBarber.id,
            barberName: matchedBarber.name || 'Mitarbeiter',
            barberImage: matchedBarber.image,
            checkInAt: checkInRecord.checkInAt.toISOString(),
            status: checkInRecord.status,
            delayMinutes: checkInRecord.delayMinutes,
            locationName: checkInRecord.location.name,
            canCheckOut: true,
            message: status === 'LATE'
                ? `Verspätet um ${delayMinutes} Min. eingecheckt (${format(viennaNow, 'HH:mm')} Uhr, Soll: ${expectedTimes.startTime} Uhr).`
                : `Pünktlich eingecheckt um ${format(viennaNow, 'HH:mm')} Uhr (Soll: ${expectedTimes.startTime} Uhr). Guten Morgen!`,
        });
    } catch (error) {
        console.error('Error recording employee check-in/out:', error);
        return NextResponse.json({ error: 'Fehler beim Check-in/out.' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // Run auto check-out processor first
        await processAutoCheckOuts();

        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const locationId = searchParams.get('locationId');
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        let dateFilter: any = {};
        if (startDateStr) {
            dateFilter.gte = new Date(`${startDateStr}T00:00:00.000Z`);
        } else {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter.gte = startOfMonth;
        }

        if (endDateStr) {
            dateFilter.lte = new Date(`${endDateStr}T23:59:59.999Z`);
        }

        const checkIns = await prisma.employeeCheckIn.findMany({
            where: {
                ...(locationId ? { locationId } : {}),
                date: dateFilter,
            },
            include: {
                barber: { select: { id: true, name: true, image: true, role: true } },
                location: { select: { id: true, name: true, city: true } },
            },
            orderBy: {
                checkInAt: 'desc',
            },
        });

        const barberIds = Array.from(new Set(checkIns.map(c => c.barberId)));
        const shifts = await prisma.barberShift.findMany({
            where: {
                barberId: { in: barberIds },
                date: dateFilter,
            },
            select: { barberId: true, date: true, startTime: true, endTime: true },
        });

        const shiftMap = new Map<string, { startTime: string; endTime: string }>();
        shifts.forEach(s => {
            const dateKey = format(s.date, 'yyyy-MM-dd');
            shiftMap.set(`${s.barberId}_${dateKey}`, { startTime: s.startTime, endTime: s.endTime });
        });

        // Also fetch availabilities for locations to map default opening hours when no shift is set
        const locationAvailabilities = await prisma.availability.findMany({
            where: { barberId: null },
            select: { locationId: true, dayOfWeek: true, startTime: true, endTime: true },
        });

        const availMap = new Map<string, { startTime: string; endTime: string }>();
        locationAvailabilities.forEach(a => {
            if (a.locationId) {
                availMap.set(`${a.locationId}_${a.dayOfWeek}`, { startTime: a.startTime, endTime: a.endTime });
            }
        });

        const formattedCheckIns = checkIns.map(c => {
            const dateKey = format(c.date, 'yyyy-MM-dd');
            const shiftInfo = shiftMap.get(`${c.barberId}_${dateKey}`);
            
            const checkInVienna = toZonedTime(c.checkInAt, timeZone);
            const dayOfWeek = checkInVienna.getDay();
            const defaultAvail = availMap.get(`${c.locationId}_${dayOfWeek}`);

            const plannedStart = shiftInfo?.startTime || defaultAvail?.startTime || '10:00';
            const plannedEnd = shiftInfo?.endTime || defaultAvail?.endTime || '19:00';

            return {
                id: c.id,
                barberId: c.barber.id,
                barberName: c.barber.name || 'Mitarbeiter',
                barberImage: c.barber.image,
                barberRole: c.barber.role,
                locationId: c.location.id,
                locationName: c.location.name,
                locationCity: c.location.city,
                date: format(c.date, 'yyyy-MM-dd'),
                checkInAt: c.checkInAt.toISOString(),
                checkOutAt: c.checkOutAt ? c.checkOutAt.toISOString() : null,
                isAutoCheckOut: c.isAutoCheckOut,
                plannedStart: plannedStart,
                plannedEnd: plannedEnd,
                status: c.status,
                delayMinutes: c.delayMinutes,
                note: c.note,
            };
        });

        return NextResponse.json({
            checkIns: formattedCheckIns,
        });
    } catch (error) {
        console.error('Error fetching employee check-ins:', error);
        return NextResponse.json({ error: 'Fehler beim Laden der Zeiterfassung.' }, { status: 500 });
    }
}
