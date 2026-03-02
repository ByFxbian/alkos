import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const shifts = await prisma.barberShift.findMany({
        where: {
            date: { gte: new Date() }
        },
        include: {
            barber: { select: { id: true, name: true } },
            location: { select: { id: true, name: true } },
        },
        orderBy: { date: 'asc' },
    });

    return NextResponse.json(shifts);
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { barberId, locationId, date, startTime, endTime, note } = body;

        if (!barberId || !locationId || !date || !startTime || !endTime) {
            return NextResponse.json({ error: 'Pflichtfelder fehlen' }, { status: 400 });
        }

        const shift = await prisma.barberShift.upsert({
            where: {
                barberId_date: {
                    barberId,
                    date: new Date(date),
                }
            },
            update: {
                locationId,
                startTime,
                endTime,
                note: note || null,
            },
            create: {
                barberId,
                locationId,
                date: new Date(date),
                startTime,
                endTime,
                note: note || null,
            },
            include: {
                barber: { select: { name: true } },
                location: { select: { name: true } },
            }
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error: unknown) {
        console.error('Shift creation error:', error);
        return NextResponse.json({ error: 'Fehler beim Erstellen des Schicht-Overrides.' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const shiftId = searchParams.get('id');

        if (!shiftId) {
            return NextResponse.json({ error: 'Shift ID fehlt' }, { status: 400 });
        }

        await prisma.barberShift.delete({
            where: { id: shiftId },
        });

        return NextResponse.json({ message: 'Schicht-Override gelöscht' });
    } catch (error: unknown) {
        console.error('Shift deletion error:', error);
        return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
    }
}
