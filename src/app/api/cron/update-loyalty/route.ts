import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    if (searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
        const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

        const completedAppointments = await prisma.appointment.findMany({
        where: {
            startTime: {
            gte: startOfYesterday,
            lt: endOfYesterday,
            },
        },
        });

        const customerUpdateCounts: Record<string, number> = {};
        for (const appointment of completedAppointments) {
        customerUpdateCounts[appointment.customerId] = (customerUpdateCounts[appointment.customerId] || 0) + 1;
        }

        for (const customerId in customerUpdateCounts) {
        const user = await prisma.user.findUnique({ where: { id: customerId } });
        if (user) {
            const newCount = user.completedAppointments + customerUpdateCounts[customerId];
            
            await prisma.user.update({
            where: { id: customerId },
            data: {
                completedAppointments: newCount,
                hasFreeAppointment: newCount >= 15 ? true : user.hasFreeAppointment,
            },
            });
        }
        }

        return NextResponse.json({ message: `Loyalty points updated for ${completedAppointments.length} appointments.` });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'An error occurred.' }, { status: 500 });
    }
}