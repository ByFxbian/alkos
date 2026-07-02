import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AdminLocationFilter from '@/components/AdminLocationFilter';
import { cookies } from 'next/headers';
import DashboardClient from '@/components/DashboardClient';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { userLocations: { include: { location: { select: { id: true, name: true } } } } },
  });

  if (!currentUser) {
    redirect('/api/auth/signin');
  }

  let availableLocations: {id: string, name: string}[] = [];
  if (currentUser.role === 'ADMIN') {
      availableLocations = await prisma.location.findMany({ select: { id: true, name: true } });
  } else {
      availableLocations = currentUser.userLocations.map(ul => ul.location);
  }

  const userAllowedLocationIds = currentUser.role === 'ADMIN' 
    ? availableLocations.map(l => l.id)
    : currentUser.userLocations.map(ul => ul.location.id);

  if (currentUser.role === 'HEADOFBARBER' && (!userAllowedLocationIds || userAllowedLocationIds.length === 0)) {
     return (
        <div className="p-8 text-center text-red-500">
            <h1 className="text-xl font-bold">Kein Standort zugewiesen</h1>
            <p>Bitte kontaktieren Sie einen Administrator.</p>
        </div>
     );
  }

  const cookieStore = await cookies();
  const filterId = cookieStore.get('admin_location_filter')?.value;

  let effectiveLocationIds = userAllowedLocationIds;

  if (filterId && filterId !== 'ALL') {
      if (userAllowedLocationIds.includes(filterId)) {
        effectiveLocationIds = [filterId];
      }
  }

  const isFiltered = filterId && filterId !== 'ALL';
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const userLocationFilter = { userLocations: { some: { location: { id: { in: effectiveLocationIds } } } } };
  const locationFilter = { locationId: { in: effectiveLocationIds } };

  // Load barbers and services metadata for the dropdowns
  const [barbers, services] = await Promise.all([
    prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] } },
          { appointmentsAsBarber: { some: { startTime: { gte: thirtyDaysAgo } } } }
        ],
        ...userLocationFilter,
      },
      select: { id: true, name: true, image: true }
    }),

    prisma.service.findMany({
        where: {
            OR: [
                { ...locationFilter },
                { locationId: null }
            ]
        },
        select: { id: true, name: true }
    })
  ]);

  return (
    <DashboardClient
      barbers={barbers}
      services={services}
      userName={session.user.name ?? null}
      isFiltered={!!isFiltered}
      effectiveLocationIdsCount={effectiveLocationIds.length}
      availableLocations={availableLocations}
      locationFilterComponent={<AdminLocationFilter locations={availableLocations} />}
    />
  );
}
