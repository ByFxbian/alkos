import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, subMonths, format, endOfDay } from "date-fns";
import { de } from 'date-fns/locale';
import { cookies } from 'next/headers';
import { Prisma } from "@/generated/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30d';
    const barberIdsParam = searchParams.get('barberIds') || 'all';
    const serviceIdsParam = searchParams.get('serviceIds') || 'all';

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { userLocations: true }
    });

    const allowedLocationIds = session.user.role === 'ADMIN'
        ? (await prisma.location.findMany()).map(l => l.id)
        : dbUser?.userLocations.map(ul => ul.locationId) || [];

    const cookieStore = await cookies();
    const filterId = cookieStore.get('admin_location_filter')?.value || 'ALL';
    const includeManual = cookieStore.get('include_manual_revenue')?.value === 'true';

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
                startDate.setHours(0,0,0,0);
            } else {
                startDate = subDays(now, 30);
            }
            break;
        default:
            startDate = subDays(now, 30);
    }

    let endDate = range === 'yesterday' ? startOfDay(now) : now;
    if (range === 'custom' && endDateParam) {
        endDate = new Date(endDateParam);
        endDate.setHours(23, 59, 59, 999);
    }

    // Parse filters
    const barberIds = barberIdsParam !== 'all' ? barberIdsParam.split(',') : null;
    const serviceIds = serviceIdsParam !== 'all' ? serviceIdsParam.split(',') : null;

    try {
        // Fetch appointments matching query
        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lt: endDate,
                },
                isFree: false,
                ...locationFilter,
                ...(barberIds ? { barberId: { in: barberIds } } : {}),
                ...(serviceIds ? { serviceId: { in: serviceIds } } : {}),
            },
            include: {
                service: {
                    select: { id: true, price: true, name: true }
                },
                location: {
                    select: { slug: true }
                },
                barber: {
                    select: { id: true, name: true, image: true }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        // Fetch manual entries (filtered by location and barber if applicable)
        const manualEntries = includeManual
            ? await prisma.manualEntry.findMany({
                where: {
                    date: {
                        gte: startDate,
                        lte: endDate,
                    },
                    locationId: filterId === 'ALL' ? { in: queryLocationIds } : filterId,
                    ...(barberIds ? { barberId: { in: barberIds } } : {}),
                }
            })
            : [];

        // Fetch list of active barbers for team performance mapping
        const allBarbers = await prisma.user.findMany({
            where: {
                OR: [
                    { role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] } },
                    { appointmentsAsBarber: { some: { startTime: { gte: startDate, lt: endDate } } } }
                ],
                userLocations: { some: { locationId: { in: allowedLocationIds } } }
            },
            select: { id: true, name: true, image: true }
        });

        // 1. Calculate Revenue Chart & Totals
        const groupedData: Record<string, number> = {};
        let totalRevenue = 0;
        let totalAppointments = appointments.length;

        const PROMO_START_DATE = '2026-03-07';
        const PROMO_END_DATE = '2026-03-14';

        const getEffectivePrice = (app: any) => {
            let price = app.service.price;
            const dateStr = format(new Date(app.startTime), 'yyyy-MM-dd');
            const isBaden = app.location?.slug === 'baden';
            const isHaircut = app.service.name.toLowerCase().includes('haarschnitt');
            
            if (isBaden && isHaircut && dateStr >= PROMO_START_DATE && dateStr <= PROMO_END_DATE) {
                return 5;
            }
            return price;
        };

        // Group appointments
        appointments.forEach(app => {
            const price = getEffectivePrice(app);
            totalRevenue += price;

            let key = '';
            if (groupBy === 'month') {
                key = format(new Date(app.startTime), 'MMM yyyy', { locale: de });
            } else {
                key = format(new Date(app.startTime), 'dd.MM.', { locale: de });
            }

            groupedData[key] = (groupedData[key] || 0) + price;
        });

        // Group manual entries
        manualEntries.forEach(entry => {
            totalRevenue += entry.price;
            totalAppointments++;

            let key = '';
            if (groupBy === 'month') {
                key = format(new Date(entry.date), 'MMM yyyy', { locale: de });
            } else {
                key = format(new Date(entry.date), 'dd.MM.', { locale: de });
            }

            groupedData[key] = (groupedData[key] || 0) + entry.price;
        });

        const chartData = Object.entries(groupedData).map(([name, value]) => ({
            name,
            value
        }));

        // 2. Barber Stats (Team Performance)
        const barberStatsMap: Record<string, { id: string, name: string, image: string | null, appointments: number, revenue: number }> = {};
        allBarbers.forEach(b => {
            barberStatsMap[b.id] = { id: b.id, name: b.name || 'Unbekannt', image: b.image, appointments: 0, revenue: 0 };
        });

        appointments.forEach(app => {
            if (!barberStatsMap[app.barberId]) {
                barberStatsMap[app.barberId] = {
                    id: app.barberId,
                    name: app.barber.name || 'Ehemalig / Unbekannt',
                    image: app.barber.image,
                    appointments: 0,
                    revenue: 0
                };
            }
            barberStatsMap[app.barberId].appointments++;
            barberStatsMap[app.barberId].revenue += getEffectivePrice(app);
        });

        manualEntries.forEach(entry => {
            if (!barberStatsMap[entry.barberId]) {
                const b = allBarbers.find(x => x.id === entry.barberId);
                barberStatsMap[entry.barberId] = {
                    id: entry.barberId,
                    name: b?.name || 'Unbekannt',
                    image: b?.image || null,
                    appointments: 0,
                    revenue: 0
                };
            }
            barberStatsMap[entry.barberId].appointments++;
            barberStatsMap[entry.barberId].revenue += entry.price;
        });

        // Filter and sort barber stats array
        let barberStatsArray = Object.values(barberStatsMap);
        if (barberIds) {
            barberStatsArray = barberStatsArray.filter(b => barberIds.includes(b.id));
        }
        barberStatsArray.sort((a, b) => b.revenue - a.revenue);

        // 3. New Customers Count in this timeframe
        const newCustomersCount = await prisma.user.count({
            where: {
                role: 'KUNDE',
                createdAt: {
                    gte: startDate,
                    lt: endDate,
                },
                ...(filterId !== 'ALL' ? {
                    appointmentsAsCustomer: {
                        some: {
                            locationId: { in: queryLocationIds }
                        }
                    }
                } : {})
            }
        });

        // 4. Popular Services stats
        const serviceCountMap: Record<string, { name: string, count: number }> = {};
        appointments.forEach(app => {
            const sName = app.service.name;
            if (!serviceCountMap[sName]) {
                serviceCountMap[sName] = { name: sName, count: 0 };
            }
            serviceCountMap[sName].count++;
        });

        const popularServiceStats = Object.values(serviceCountMap)
            .sort((a, b) => b.count - a.count);

        const topServiceName = popularServiceStats[0]?.name || '-';
        const topServiceCount = popularServiceStats[0]?.count || 0;

        // 5. Busiest Day
        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const dayCounts: Record<number, number> = {};
        appointments.forEach(app => {
            const day = new Date(app.startTime).getDay();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const busiestDayEntry = Object.entries(dayCounts).sort(([,a], [,b]) => b - a)[0];
        const busiestDay = busiestDayEntry ? dayNames[parseInt(busiestDayEntry[0])] : '-';
        const busiestDayCount = busiestDayEntry ? busiestDayEntry[1] : 0;

        // 6. Booking Heatmap
        const heatmapData: Record<string, number> = {};
        let heatmapMax = 0;
        appointments.forEach(app => {
            const d = new Date(app.startTime);
            const key = `${d.getDay()}-${d.getHours()}`;
            heatmapData[key] = (heatmapData[key] || 0) + 1;
            if (heatmapData[key] > heatmapMax) heatmapMax = heatmapData[key];
        });

        // 7. Returning Customers
        const returningCustomersResult = queryLocationIds.length === 0
            ? [{ count: BigInt(0) }]
            : await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
                SELECT COUNT(*) as count FROM (
                    SELECT "customerId" FROM "Appointment"
                    WHERE "locationId" IN (${Prisma.join(queryLocationIds)})
                    GROUP BY "customerId" HAVING COUNT(*) >= 2
                ) as returning_customers
            `);
        const returningCustomers = Number(returningCustomersResult[0]?.count ?? 0);

        // 8. Manual Entry Totals for display in ManualEntryDashboardToggle
        const manualRevenue = manualEntries.reduce((sum, e) => sum + e.price, 0);
        const manualTips = manualEntries.reduce((sum, e) => sum + e.tip, 0);
        const manualCount = manualEntries.length;

        return NextResponse.json({
            chartData,
            totalRevenue,
            totalAppointments,
            newCustomersCount,
            topServiceName,
            topServiceCount,
            busiestDay,
            busiestDayCount,
            heatmapData,
            heatmapMax,
            returningCustomers,
            barberStats: barberStatsArray,
            manualRevenue,
            manualTips,
            manualCount,
            avgRevenuePerAppointment: totalAppointments > 0 ? (totalRevenue / totalAppointments).toFixed(2) : '0.00'
        });

    } catch (error) {
        console.error("Dashboard API Error:", error);
        return NextResponse.json({ error: 'Fehler beim Berechnen der Statistiken' }, { status: 500 });
    }
}
