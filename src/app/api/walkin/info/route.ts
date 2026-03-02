import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pinSetting = await prisma.settings.findUnique({
            where: { key: 'walkin_pin' },
        });

        const pinLength = pinSetting?.value?.length || 4;

        return NextResponse.json({ pinLength });
    } catch (error) {
        console.error('Error fetching walkin info:', error);
        return NextResponse.json({ pinLength: 4 }, { status: 500 });
    }
}
