import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppointmentList from '@/components/AppointmentList';
import LoyaltyCard from '@/components/LoyaltyCard';
import Link from 'next/link';

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

            <div className='mb-12 text-center'>
                <Link
                    href="/redeem-stamp"
                    className="bg-gold-500 text-black font-bold text-lg px-8 py-3 roudned-full hover:bg-gold-400 transition-transform duration-300 ease-in-out inline-block transform hover:scale-105"
                >
                    Stempel-Code scannen
                </Link>
            </div>

            <AppointmentList appointments={appointments} />
        </div>
    )
}