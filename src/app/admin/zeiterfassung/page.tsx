import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import CheckInTerminal from '@/components/CheckInTerminal';
import AdminZeiterfassung from '@/components/AdminZeiterfassung';

export const revalidate = 0;

const ALLOWED_EMAILS = [
    'alen.mujic0212@gmail.com',
    'alkostermin@gmail.com',
    'sopa.fabian@gmx.net',
];

export default async function ZeiterfassungPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect('/login');
    }

    const userRole = session.user.role;
    const userEmail = (session.user.email || '').toLowerCase();

    // Check if user has permission to access Zeiterfassung page
    const isSpecialAccount = ALLOWED_EMAILS.includes(userEmail) || userEmail.includes('alkos') || userEmail.includes('alen');
    const hasAccess = ['ADMIN', 'HEADOFBARBER'].includes(userRole) || isSpecialAccount;

    if (!hasAccess) {
        redirect('/');
    }

    const isAdminOrHead = userRole === 'ADMIN' || userRole === 'HEADOFBARBER' || isSpecialAccount;

    // Load available locations
    let availableLocations: { id: string; name: string; city: string }[] = [];

    if (isAdminOrHead || userRole === 'ADMIN') {
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

    if (availableLocations.length === 0) {
        availableLocations = await prisma.location.findMany({
            select: { id: true, name: true, city: true },
            orderBy: { name: 'asc' },
        });
    }

    // Load barbers for check-in terminal
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
        <div className="container mx-auto py-6 sm:py-10 px-3 sm:px-4 space-y-8 sm:space-y-12 animate-in fade-in duration-500">
            {/* Terminal Check-in Widget */}
            <CheckInTerminal barbers={barbers} locations={availableLocations} />

            {/* Admin Attendance & Delay Report Table */}
            {isAdminOrHead && (
                <div className="pt-8 sm:pt-10 border-t border-[var(--color-border)]">
                    <AdminZeiterfassung locations={availableLocations} />
                </div>
            )}
        </div>
    );
}
