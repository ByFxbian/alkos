import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`walkin-pin:${ip}`, { limit: 20, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz.' }, { status: 429 });
        }

        const { pin } = await req.json();

        if (!pin || typeof pin !== 'string') {
            return NextResponse.json({ error: 'PIN erforderlich' }, { status: 400 });
        }


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


        const pinSetting = await prisma.settings.findUnique({
            where: { key: 'walkin_pin' },
        });

        if (pinSetting && pin === pinSetting.value) {

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
