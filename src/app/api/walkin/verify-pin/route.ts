import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { pin } = await req.json();

        if (!pin || typeof pin !== 'string') {
            return NextResponse.json({ error: 'PIN erforderlich' }, { status: 400 });
        }

        const pinSetting = await prisma.settings.findUnique({
            where: { key: 'walkin_pin' },
        });

        if (!pinSetting) {
            return NextResponse.json({ error: 'Walk-In System nicht konfiguriert' }, { status: 500 });
        }

        if (pin === pinSetting.value) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Falscher PIN' }, { status: 401 });
        }
    } catch (error) {
        console.error('Error verifying PIN:', error);
        return NextResponse.json({ error: 'Interner Fehler' }, { status: 500 });
    }
}
