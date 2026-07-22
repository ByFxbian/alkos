import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CheckInTerminal from '@/components/CheckInTerminal';
import AdminZeiterfassung from '@/components/AdminZeiterfassung';

export const revalidate = 0;

export default async function ZeiterfassungPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    const userRole = session.user.role;
    const isAdminOrHead = userRole === 'ADMIN' || userRole === 'HEADOFBARBER';

    let availableLocations: { id: string; name: string; city: string }[] = [];

    if (userRole === 'ADMIN') {
        availableLocations = await prisma.location.findMany({
            select: { id: true, name: true, city: true },
            orderBy: { name: 'asc' },
        });
    } else {
        const userWithLocs = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                userLocations: {
                    include: { location: { select: { id: true, name: true, city: true } } },
                },
            },
        });
        availableLocations = userWithLocs?.userLocations.map(ul => ul.location) || [];
    }

    const allowedLocationIds = availableLocations.map(l => l.id);
    const barbers = await prisma.user.findMany({
        where: {
            role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
            ...(allowedLocationIds.length > 0
                ? { userLocations: { some: { locationId: { in: allowedLocationIds } } } }
                : {}),
        },
        select: {
            id: true,
            name: true,
            image: true,
            role: true,
        },
        orderBy: { name: 'asc' },
    });

    return (
        <div className="container mx-auto py-10 px-4 space-y-12 animate-in fade-in duration-500">
            <CheckInTerminal barbers={barbers} locations={availableLocations} />
            {isAdminOrHead && (
                <div className="pt-10 border-t border-[var(--color-border)]">
                    <AdminZeiterfassung locations={availableLocations} />
                </div>
            )}
        </div>
    );
}
