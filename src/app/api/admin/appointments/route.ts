import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: { locations: true }
    });
    const allowedLocationIds = session.user.role === 'ADMIN'
        ? (await prisma.location.findMany()).map(l => l.id)
        : dbUser?.locations.map(l => l.id) || [];
    
    const cookieStore = await cookies();
    const filterId = cookieStore.get('admin_location_filter')?.value || 'ALL';
    
    let queryLocationIds = allowedLocationIds;
    if (filterId !== 'ALL' && allowedLocationIds.includes(filterId)) {
        queryLocationIds = [filterId];
    }

    const appointments = await prisma.appointment.findMany({
        where: {
            locationId: { in: queryLocationIds }
        },
        include: {
            customer: true,
            barber: true,
            service: true,
            location: true
        },
        orderBy: { startTime: 'desc' },
    });

    return NextResponse.json(appointments);
}