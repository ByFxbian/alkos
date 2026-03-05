import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { pin } = await req.json();

        if (!pin || typeof pin !== 'string') {
            return NextResponse.json({ error: 'PIN erforderlich' }, { status: 400 });
        }

        // Try matching PIN against location postal codes first
        const matchingLocation = await prisma.location.findFirst({
            where: { postalCode: pin },
            select: { id: true, name: true, slug: true, postalCode: true },
        });

        if (matchingLocation) {
            return NextResponse.json({
                success: true,
                locationId: matchingLocation.id,
                locationName: matchingLocation.name,
                locationSlug: matchingLocation.slug,
            });
        }

        // Fallback: check the legacy global walkin_pin setting
        const pinSetting = await prisma.settings.findUnique({
            where: { key: 'walkin_pin' },
        });

        if (pinSetting && pin === pinSetting.value) {
            // Legacy PIN: find the first/default location
            const defaultLocation = await prisma.location.findFirst({
                select: { id: true, name: true, slug: true },
                orderBy: { createdAt: 'asc' },
            });
            return NextResponse.json({
                success: true,
                locationId: defaultLocation?.id || null,
                locationName: defaultLocation?.name || 'ALKOS',
                locationSlug: defaultLocation?.slug || null,
            });
        }

        return NextResponse.json({ error: 'Falscher PIN' }, { status: 401 });
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
}
