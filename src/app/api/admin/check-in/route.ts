import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';
import { toZonedTime } from 'date-fns-tz';
import { startOfDay, format } from 'date-fns';

const timeZone = 'Europe/Vienna';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`checkin-pin:${ip}`, { limit: 15, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz.' }, { status: 429 });
        }

        const { pin, locationId } = await req.json();

        if (!pin || typeof pin !== 'string' || pin.length < 4) {
            return NextResponse.json({ error: 'Bitte gib deinen gültigen PIN ein (mind. 4 Stellen).' }, { status: 400 });
        }

        const now = new Date();
        const viennaNow = toZonedTime(now, timeZone);
        const todayDateStr = format(viennaNow, 'yyyy-MM-dd');
        const todayDate = new Date(`${todayDateStr}T00:00:00.000Z`);

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

        if (existingCheckIn) {
            return NextResponse.json({
                alreadyCheckedIn: true,
                barberName: matchedBarber.name || 'Mitarbeiter',
                barberImage: matchedBarber.image,
                checkInAt: existingCheckIn.checkInAt.toISOString(),
                status: existingCheckIn.status,
                delayMinutes: existingCheckIn.delayMinutes,
                locationName: existingCheckIn.location.name,
                message: `Bereits heute um ${format(toZonedTime(existingCheckIn.checkInAt, timeZone), 'HH:mm')} Uhr eingecheckt.`,
            });
        }

        const todayShift = await prisma.barberShift.findFirst({
            where: {
                barberId: matchedBarber.id,
                date: todayDate,
            },
        });

        let status = 'ON_TIME';
        let delayMinutes = 0;

        if (todayShift && todayShift.startTime) {
            const [shiftHour, shiftMinute] = todayShift.startTime.split(':').map(Number);
            const shiftStartVienna = new Date(viennaNow);
            shiftStartVienna.setHours(shiftHour, shiftMinute, 0, 0);

            const diffMs = viennaNow.getTime() - shiftStartVienna.getTime();
            const diffMinutes = Math.round(diffMs / 60000);

            if (diffMinutes > 2) {
                status = 'LATE';
                delayMinutes = diffMinutes;
            } else {
                status = 'ON_TIME';
                delayMinutes = 0;
            }
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
            barberName: matchedBarber.name || 'Mitarbeiter',
            barberImage: matchedBarber.image,
            checkInAt: checkInRecord.checkInAt.toISOString(),
            status: checkInRecord.status,
            delayMinutes: checkInRecord.delayMinutes,
            locationName: checkInRecord.location.name,
            message: status === 'LATE'
                ? `Verspätet um ${delayMinutes} Min. eingecheckt (${format(viennaNow, 'HH:mm')} Uhr).`
                : `Pünktlich eingecheckt um ${format(viennaNow, 'HH:mm')} Uhr. Guten Morgen!`,
        });
    } catch (error) {
        console.error('Error recording employee check-in:', error);
        return NextResponse.json({ error: 'Fehler beim Check-in.' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
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

        const shiftMap = new Map<string, string>();
        shifts.forEach(s => {
            const dateKey = format(s.date, 'yyyy-MM-dd');
            shiftMap.set(`${s.barberId}_${dateKey}`, s.startTime);
        });

        const formattedCheckIns = checkIns.map(c => {
            const dateKey = format(c.date, 'yyyy-MM-dd');
            const plannedStart = shiftMap.get(`${c.barberId}_${dateKey}`) || 'Keine Schicht';
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
                plannedStart: plannedStart,
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
