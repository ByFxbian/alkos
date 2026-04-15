import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import AdminManualEntries from '@/components/AdminManualEntries';

export const revalidate = 0;

export default async function AdminManualEntriesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email || !['ADMIN', 'HEADOFBARBER', 'BARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { userLocations: { include: { location: { select: { id: true, name: true } } } } },
  });

  if (!currentUser) {
    redirect('/api/auth/signin');
  }

  let availableLocations: { id: string; name: string }[] = [];
  if (currentUser.role === 'ADMIN') {
    availableLocations = await prisma.location.findMany({ select: { id: true, name: true } });
  } else {
    availableLocations = currentUser.userLocations.map(ul => ul.location);
  }

  const userAllowedLocationIds = currentUser.role === 'ADMIN'
    ? availableLocations.map(l => l.id)
    : currentUser.userLocations.map(ul => ul.location.id);

  // Wir ignorieren hier den admin_location_filter Cookie für die Barber-Liste,
  // da Manuelle Einträge einen eigenen lokalen Filter haben und man ggf. alle sehen möchte.
  const barbers = await prisma.user.findMany({
    where: {
      role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
      userLocations: { some: { locationId: { in: userAllowedLocationIds } } },
    },
    select: { id: true, name: true, image: true, barberPin: true },
  });

  const isBarberOnly = currentUser.role === 'BARBER';

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700">
      <AdminManualEntries
        currentUserId={currentUser.id}
        isBarberOnly={isBarberOnly}
        userRole={currentUser.role}
        barbers={barbers.map(b => ({ id: b.id, name: b.name || 'Unbekannt', image: b.image, hasPin: !!b.barberPin }))}
        locations={availableLocations}
      />
    </div>
  );
}
