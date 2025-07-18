import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppointmentList from '@/components/AppointmentList';
import LoyaltyCard from '@/components/LoyaltyCard';

export default async function MeineTerminePage() {
    const session = await getServerSession(authOptions);

    if(!session || !session.user) {
        redirect('/login?callbackUrl=/meine-termine');
    }

    const [currentUser, appointments] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.appointment.findMany({
            where: {
                customerId: session.user.id,
                startTime: {
                    gte: new Date(),
                },
            },
            include: {
                service: true,
                barber: true,
            },
            orderBy: {
                startTime: 'asc',
            },
        }),
    ]);

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Meine Termine</h1>

            {/* NEUE Sektion für den Stempelpass */}
            <div className="mb-12">
                <LoyaltyCard 
                completedAppointments={currentUser.completedAppointments} 
                hasFreeAppointment={currentUser.hasFreeAppointment}
                />
            </div>

            <AppointmentList appointments={appointments} />
        </div>
    )
}