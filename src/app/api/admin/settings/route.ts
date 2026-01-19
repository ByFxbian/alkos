import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const settings = await prisma.settings.findMany();
        const settingsMap: Record<string, string> = {};

        for (const setting of settings) {
            settingsMap[setting.key] = setting.value;
        }

        return NextResponse.json(settingsMap);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Fehler beim Laden der Einstellungen' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const { key, value } = await req.json();

        if (!key || typeof key !== 'string') {
            return NextResponse.json({ error: 'Schlüssel erforderlich' }, { status: 400 });
        }

        if (key === 'walkin_pin') {
            if (!value || typeof value !== 'string' || value.length < 4) {
                return NextResponse.json({ error: 'PIN muss mindestens 4 Zeichen haben' }, { status: 400 });
            }
        }

        const updatedSetting = await prisma.settings.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });

        return NextResponse.json({ success: true, setting: updatedSetting });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Fehler beim Speichern der Einstellungen' }, { status: 500 });
    }
}
