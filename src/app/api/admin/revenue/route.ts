import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, subMonths, format } from "date-fns";
import { de } from 'date-fns/locale'
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d'
    const barberId = searchParams.get('barberId') || 'all';

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { userLocations: true }
    });

    const allowedLocationIds = session.user.role === 'ADMIN'
        ? (await prisma.location.findMany()).map(l => l.id)
        : dbUser?.userLocations.map(ul => ul.locationId) || [];

    const cookieStore = await cookies();
    const filterId = cookieStore.get('admin_location_filter')?.value || 'ALL';

    let queryLocationIds = allowedLocationIds;

    if (filterId !== 'ALL') {
        if (allowedLocationIds.includes(filterId)) {
            queryLocationIds = [filterId];
        }
    }

    const locationFilter = filterId === 'ALL'
        ? { OR: [{ locationId: { in: queryLocationIds } }, { locationId: null }] }
        : { locationId: { in: queryLocationIds } };

    const now = new Date();
    let startDate = new Date();
    let groupBy = 'day';

    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    switch (range) {
        case 'yesterday':
            startDate = subDays(startOfDay(now), 1);
            break;
        case '7d':
            startDate = subDays(now, 7);
            break;
        case '30d':
            startDate = subDays(now, 30);
            break;
        case '3m':
            startDate = subMonths(now, 3);
            groupBy = 'month';
            break;
        case '6m':
            startDate = subMonths(now, 6);
            groupBy = 'month';
            break;
        case '12m':
            startDate = subMonths(now, 12);
            groupBy = 'month';
            break;
        case 'all':
            startDate = new Date(0);
            groupBy = 'month';
            break;
        case 'custom':
            if (startDateParam && endDateParam) {
                startDate = new Date(startDateParam);
                // Set to start of day for safety
                startDate.setHours(0,0,0,0);
            } else {
                startDate = subDays(now, 7);
            }
            break;
        default:
            startDate = subDays(now, 7);
    }

    let endDate = range === 'yesterday' ? startOfDay(now) : now;
    if (range === 'custom' && endDateParam) {
        endDate = new Date(endDateParam);
        // Set to end of day to include the full day
        endDate.setHours(23, 59, 59, 999);
    }

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lt: endDate,
                },
                ...(barberId !== 'all' ? { barberId } : {}),
                isFree: false,
                ...locationFilter
            },
            include: {
                service: {
                    select: { price: true, name: true }
                },
                location: {
                    select: { slug: true }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        const groupedData: Record<string, number> = {};
        let totalRevenue = 0;

        const PROMO_START_DATE = '2026-03-07';
        const PROMO_END_DATE = '2026-03-14';

        appointments.forEach(app => {
            let price = app.service.price;
            
            // Apply 5€ Promo for Baden haircuts during the promo period
            const dateStr = format(new Date(app.startTime), 'yyyy-MM-dd');
            const isBaden = app.location?.slug === 'baden';
            const isHaircut = app.service.name.toLowerCase().includes('haarschnitt');
            
            if (isBaden && isHaircut && dateStr >= PROMO_START_DATE && dateStr <= PROMO_END_DATE) {
                price = 5;
            }

            totalRevenue += price;

            let key = '';
            if (groupBy === 'month') {
                key = format(new Date(app.startTime), 'MMM yyyy', { locale: de });
            } else {
                key = format(new Date(app.startTime), 'dd.MM.', { locale: de });
            }

            if (!groupedData[key]) {
                groupedData[key] = 0;
            }
            groupedData[key] += price;
        });

        const chartData = Object.entries(groupedData).map(([name, value]) => ({
            name,
            value
        }));

        // Fetch all possible barbers for the dropdown (including former ones who had appointments in this range)
        const relevantBarbers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] } },
                    { appointmentsAsBarber: { some: { startTime: { gte: startDate, lt: endDate } } } }
                ],
                userLocations: { some: { locationId: { in: allowedLocationIds } } }
            },
            select: { id: true, name: true }
        });

        return NextResponse.json({
            chartData,
            totalRevenue,
            appointmentCount: appointments.length,
            barbers: relevantBarbers
        });
    } catch (error) {
        console.error("Revenue API Error:", error);
        return NextResponse.json({ error: 'Fehler beim Laden der Daten' }, { status: 500 });
    }
}