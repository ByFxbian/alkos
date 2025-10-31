import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AppointmentList from '@/components/AppointmentList';
import LoyaltyCard from '@/components/LoyaltyCard';
import Link from 'next/link';
import PastAppointmentList from '@/components/PastAppointmentList';

export default async function MeineTerminePage() {
    const session = await getServerSession(authOptions);

    if(!session || !session.user) {
        redirect('/login?callbackUrl=/meine-termine');
    }

    const now = new Date();

    const [currentUser, futureAppointments, pastAppointments] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.user.id } }),
        prisma.appointment.findMany({
            where: {
                customerId: session.user.id,
                startTime: {
                    gte: now,
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

        prisma.appointment.findMany({
            where: {
                customerId: session.user.id,
                startTime: {
                    lt: now,
                },
            },
            include: {
                service: true,
                barber: true,
            },
            orderBy: {
                startTime: 'desc', 
            },
            take: 10,
        }),
    ]);

    if (!currentUser) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <h1 className="text-4xl font-bold tracking-tight mb-8">Mein Bereich</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-4">Stempelpass</h2>
                    <LoyaltyCard 
                        completedAppointments={currentUser.completedAppointments} 
                        hasFreeAppointment={currentUser.hasFreeAppointment}
                    />
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <h2 className="text-2xl font-bold tracking-tight mb-4 text-center">Stempel abholen</h2>
                    <p className="text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>Scanne den QR-Code bei deinem Barber, um einen Stempel zu erhalten.</p>
                    <Link
                        href="/redeem-stamp"
                        className="bg-gold-500 text-black font-bold text-lg px-8 py-3 rounded-full hover:bg-gold-400 transition-transform duration-300 ease-in-out inline-block transform hover:scale-105"
                    >
                        Stempel-Code scannen
                    </Link>
                </div>
            </div>

            <div className="mb-12">
                <h2 className="text-2xl font-bold tracking-tight mb-4">Anstehende Termine</h2>
                <AppointmentList appointments={futureAppointments} />
            </div>

            <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Vergangene Termine</h2>
                <PastAppointmentList appointments={pastAppointments} />
            </div>
        </div>
    )
}