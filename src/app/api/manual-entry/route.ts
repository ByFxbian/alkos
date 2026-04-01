import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { barberId, locationId, serviceName, price, tip, duration, notes, date } = body;

        if (!barberId || typeof barberId !== 'string') {
            return NextResponse.json({ error: 'Barber ID erforderlich' }, { status: 400 });
        }
        if (!locationId || typeof locationId !== 'string') {
            return NextResponse.json({ error: 'Standort erforderlich' }, { status: 400 });
        }
        if (!serviceName || typeof serviceName !== 'string' || serviceName.trim().length < 1) {
            return NextResponse.json({ error: 'Service-Name erforderlich' }, { status: 400 });
        }
        if (typeof price !== 'number' || price < 0) {
            return NextResponse.json({ error: 'Gültiger Preis erforderlich' }, { status: 400 });
        }

        const barber = await prisma.user.findUnique({
            where: { id: barberId },
            select: { id: true, name: true, role: true },
        });

        if (!barber || !['BARBER', 'HEADOFBARBER', 'ADMIN'].includes(barber.role)) {
            return NextResponse.json({ error: 'Barber nicht gefunden' }, { status: 404 });
        }

        const entry = await prisma.manualEntry.create({
            data: {
                barberId,
                locationId,
                serviceName: serviceName.trim(),
                price,
                tip: typeof tip === 'number' ? tip : 0,
                duration: typeof duration === 'number' && duration > 0 ? duration : null,
                notes: notes && typeof notes === 'string' ? notes.trim() : null,
                date: new Date(date || new Date().toISOString().split('T')[0]),
            },
            include: {
                barber: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error('Error creating manual entry:', error);
        return NextResponse.json({ error: 'Fehler beim Erstellen des Eintrags' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const barberId = searchParams.get('barberId');
        const locationId = searchParams.get('locationId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where: any = {};

        if (barberId) {
            where.barberId = barberId;
        } else {
            const session = await getServerSession(authOptions);
            if (!session || !['ADMIN', 'HEADOFBARBER', 'BARBER'].includes(session.user.role)) {
                return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
            }

            if (session.user.role === 'BARBER') {
                where.barberId = session.user.id;
            } else {
                const currentUser = await prisma.user.findUnique({
                    where: { id: session.user.id },
                    include: { userLocations: true },
                });

                if (session.user.role === 'HEADOFBARBER') {
                    const locationIds = currentUser?.userLocations.map(ul => ul.locationId) || [];
                    where.locationId = { in: locationIds };
                }
            }
        }

        if (locationId) {
            where.locationId = locationId;
        }

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const entries = await prisma.manualEntry.findMany({
            where,
            include: {
                barber: { select: { id: true, name: true, image: true } },
                location: { select: { id: true, name: true } },
            },
            orderBy: { date: 'desc' },
        });

        const totalRevenue = entries.reduce((sum, e) => sum + e.price, 0);
        const totalTips = entries.reduce((sum, e) => sum + e.tip, 0);
        const totalEntries = entries.length;

        return NextResponse.json({ entries, totalRevenue, totalTips, totalEntries });
    } catch (error) {
        console.error('Error fetching manual entries:', error);
        return NextResponse.json({ error: 'Fehler beim Laden der Einträge' }, { status: 500 });
    }
}
