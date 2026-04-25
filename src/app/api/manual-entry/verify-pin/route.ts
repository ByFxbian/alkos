import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`manual-pin:${ip}`, { limit: 15, windowMs: 60_000 });
        if (!rl.ok) {
            return NextResponse.json({ error: 'Zu viele Versuche. Bitte warte kurz.' }, { status: 429 });
        }

        const { pin } = await req.json();

        if (!pin || typeof pin !== 'string' || pin.length < 4) {
            return NextResponse.json({ error: 'PIN erforderlich (mind. 4 Stellen)' }, { status: 400 });
        }


        const today = new Date();
        today.setHours(0, 0, 0, 0);

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
                userLocations: {
                    include: {
                        location: {
                            select: { id: true, name: true, slug: true },
                        },
                    },
                },
                barberShifts: {
                    where: {
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
                    },
                    include: {
                        location: {
                            select: { id: true, name: true, slug: true },
                        }
                    }
                }
            },
        });

        for (const barber of barbersWithPin) {
            if (!barber.barberPin) continue;
            const isMatch = await bcrypt.compare(pin, barber.barberPin);
            if (isMatch) {
                const locationMap = new Map();
                
                // Füge standardmäßige Standorte hinzu
                barber.userLocations.forEach(ul => {
                    locationMap.set(ul.location.id, {
                        id: ul.location.id,
                        name: ul.location.name,
                        slug: ul.location.slug,
                    });
                });

                // Füge temporäre Shift-Standorte von heute hinzu (überschreibt ggf. falls schon da)
                barber.barberShifts.forEach(shift => {
                    locationMap.set(shift.location.id, {
                        id: shift.location.id,
                        name: shift.location.name,
                        slug: shift.location.slug,
                    });
                });

                const locations = Array.from(locationMap.values());

                return NextResponse.json({
                    success: true,
                    barberId: barber.id,
                    barberName: barber.name || 'Barber',
                    barberImage: barber.image,
                    barberRole: barber.role,
                    locations,
                });
            }
        }

        return NextResponse.json({ error: 'Falscher PIN' }, { status: 401 });
    } catch (error) {
        console.error('Error verifying barber PIN:', error);
        return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
}
