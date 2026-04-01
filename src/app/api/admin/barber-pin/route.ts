import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const { barberId, pin } = await req.json();

        if (!barberId || typeof barberId !== 'string') {
            return NextResponse.json({ error: 'Barber ID erforderlich' }, { status: 400 });
        }

        if (!pin || typeof pin !== 'string' || pin.length < 4 || !/^\d+$/.test(pin)) {
            return NextResponse.json({ error: 'PIN muss mindestens 4 Ziffern haben' }, { status: 400 });
        }

        const targetBarber = await prisma.user.findUnique({
            where: { id: barberId },
            include: { userLocations: true },
        });

        if (!targetBarber || !['BARBER', 'HEADOFBARBER', 'ADMIN'].includes(targetBarber.role)) {
            return NextResponse.json({ error: 'Barber nicht gefunden' }, { status: 404 });
        }

        if (session.user.role === 'HEADOFBARBER') {
            const currentUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                include: { userLocations: true },
            });

            const myLocationIds = currentUser?.userLocations.map(ul => ul.locationId) || [];
            const barberLocationIds = targetBarber.userLocations.map(ul => ul.locationId);
            const hasCommonLocation = barberLocationIds.some(id => myLocationIds.includes(id));

            if (!hasCommonLocation) {
                return NextResponse.json({ error: 'Keine Berechtigung für diesen Barber' }, { status: 403 });
            }
        }

        const hashedPin = await bcrypt.hash(pin, 10);
        await prisma.user.update({
            where: { id: barberId },
            data: { barberPin: hashedPin },
        });

        return NextResponse.json({ success: true, message: 'PIN erfolgreich gesetzt' });
    } catch (error) {
        console.error('Error setting barber PIN:', error);
        return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
            return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const barberId = searchParams.get('barberId');

        if (!barberId) {
            return NextResponse.json({ error: 'Barber ID erforderlich' }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: barberId },
            data: { barberPin: null },
        });

        return NextResponse.json({ success: true, message: 'PIN entfernt' });
    } catch (error) {
        console.error('Error removing barber PIN:', error);
        return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
}
