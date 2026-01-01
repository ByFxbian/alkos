import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, subMonths, startOfYear, format } from "date-fns";
import { de } from 'date-fns/locale'
import { cookies } from 'next/headers';

export async function GET(req:Request) {
    const session = await getServerSession(authOptions);
    if(!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({error: 'Nicht autorisiert'}, { status: 401});
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d'
    const barberId = searchParams.get('barberId') || 'all';

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { locations: true }
    });

    const allowedLocationIds = session.user.role === 'ADMIN'
        ? (await prisma.location.findMany()).map(l => l.id)
        : dbUser?.locations.map(l => l.id) || [];

    const cookieStore = await cookies();
    const filterId = cookieStore.get('admin_location_filter')?.value || 'ALL';

    let queryLocationIds = allowedLocationIds;

    if (filterId !== 'ALL') {
        if (allowedLocationIds.includes(filterId)) {
            queryLocationIds = [filterId];
        }
    }

    const now = new Date();
    let startDate = new Date();
    let groupBy = 'day';

    switch(range) {
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
        default:
            startDate = subDays(now, 7);
    }

    const endDate = range === 'yesterday' ? startOfDay(now) : now;

    try {
        const appointments = await prisma.appointment.findMany({
            where: {
                startTime: {
                    gte: startDate,
                    lt: endDate,
                },
                ...(barberId !== 'all' ? { barberId } : {}),
                isFree: false,
                locationId: { in: queryLocationIds }
            },
            include: {
                service: {
                    select: { price: true }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });

        const groupedData:Record<string,number> = {};
        let totalRevenue = 0;

        appointments.forEach(app => {
            const price = app.service.price;
            totalRevenue += price;

            let key = '';
            if(groupBy === 'month') {
                key = format(new Date(app.startTime), 'MMM yyyy', { locale: de});
            } else {
                key = format(new Date(app.startTime), 'dd.MM.', {locale: de});
            }

            if(!groupedData[key]) {
                groupedData[key] =0;
            }
            groupedData[key] += price;
        });

        const chartData = Object.entries(groupedData).map(([name,value]) => ({
            name,
            value
        }));

        return NextResponse.json({
            chartData,
            totalRevenue,
            appointmentCount: appointments.length
        });
    } catch (error) {
        console.error("Revenue API Error:", error);
        return NextResponse.json({ error: 'Fehler beim Laden der Daten' }, { status: 500 });
    }
}