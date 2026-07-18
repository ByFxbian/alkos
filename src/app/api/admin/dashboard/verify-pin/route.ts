import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const { pin } = await req.json();

        if (!pin) {
            return NextResponse.json({ error: 'PIN erforderlich' }, { status: 400 });
        }

        const pinSetting = await prisma.settings.findUnique({
            where: { key: 'dashboard_pin' },
        });

        // If no PIN is configured, allow
        if (!pinSetting || !pinSetting.value) {
            return NextResponse.json({ success: true });
        }

        if (pin === pinSetting.value) {
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Falscher PIN' }, { status: 401 });
    } catch (error) {
        console.error('Error verifying dashboard PIN:', error);
        return NextResponse.json({ error: 'Fehler bei der Verifizierung' }, { status: 500 });
    }
}
