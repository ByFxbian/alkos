import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { barberId, serviceName, price, tip, duration, notes, date } = body;

        const existing = await prisma.manualEntry.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 });
        }

        if (barberId && existing.barberId !== barberId) {
            return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
        }

        const updated = await prisma.manualEntry.update({
            where: { id },
            data: {
                ...(serviceName && { serviceName: serviceName.trim() }),
                ...(typeof price === 'number' && { price }),
                ...(typeof tip === 'number' && { tip }),
                ...(typeof duration === 'number' ? { duration: duration > 0 ? duration : null } : {}),
                ...(notes !== undefined && { notes: notes ? notes.trim() : null }),
                ...(date && { date: new Date(date) }),
            },
            include: {
                barber: { select: { id: true, name: true } },
                location: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json({ success: true, entry: updated });
    } catch (error) {
        console.error('Error updating manual entry:', error);
        return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const barberId = searchParams.get('barberId');

        const existing = await prisma.manualEntry.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: 'Eintrag nicht gefunden' }, { status: 404 });
        }

        if (barberId && existing.barberId !== barberId) {
            return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 });
        }

        await prisma.manualEntry.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting manual entry:', error);
        return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
    }
}
