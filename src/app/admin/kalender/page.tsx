/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AvailabilityForm from '@/components/AvailabilityForm';
import ShiftManager from '@/components/ShiftManager';
import BarberSchedule from '@/components/BarberSchedule';
import { Role } from '@/generated/prisma';
import { BlockedTimeManager } from '@/components/BlockedTimeManager';
import { cookies } from 'next/headers';
import AdminLocationFilter from '@/components/AdminLocationFilter';

export const revalidate = 0;

export default async function KalenderAdminPage() {
  const session = await getServerSession(authOptions);

  const allowedRoles = ['ADMIN', 'BARBER', 'HEADOFBARBER'];
  if (!session || !session.user?.email || !allowedRoles.includes(session.user.role)) {
    redirect('/api/auth/signin');
  }

  const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { userLocations: { include: { location: { select: { id: true, name: true } } } } }
  });

  if (!dbUser) {
      redirect('/api/auth/signin');
  }
  
  const isGlobalAdmin = dbUser.role === 'ADMIN';
  
  let availableLocations: {id: string, name: string}[] = [];
  if (isGlobalAdmin) {
      availableLocations = await prisma.location.findMany({ select: { id: true, name: true } });
  } else {
      availableLocations = dbUser.userLocations.map(ul => ul.location);
  }

  const allowedLocationIds = isGlobalAdmin
      ? availableLocations.map(l => l.id)
      : dbUser.userLocations.map(ul => ul.location.id);

  const cookieStore = await cookies();
  const filterId = cookieStore.get('admin_location_filter')?.value;
  
  let queryLocationIds = allowedLocationIds;
  if (filterId && filterId !== 'ALL') {
      if (allowedLocationIds.includes(filterId)) {
          queryLocationIds = [filterId];
      }
  }


  const allLocationAvailabilities = await prisma.availability.findMany({
    where: {
      barberId: null,
      locationId: { in: availableLocations.map(l => l.id) },
    },
    orderBy: { dayOfWeek: 'asc' },
  });

  // Group by locationId
  const availabilitiesByLocation: Record<string, typeof allLocationAvailabilities> = {};
  for (const a of allLocationAvailabilities) {
    const locId = a.locationId || 'unknown';
    if (!availabilitiesByLocation[locId]) availabilitiesByLocation[locId] = [];
    availabilitiesByLocation[locId].push(a);
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const endViewDate = new Date(today);
  endViewDate.setDate(today.getDate() + 7);

  const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(dbUser.role);

  const includeNullLocations = !filterId || filterId === 'ALL';
  const locationCondition = includeNullLocations
      ? { OR: [{ locationId: { in: queryLocationIds } }, { locationId: null }] }
      : { locationId: { in: queryLocationIds } };

  const AppointmentWhereClause: any = {
      startTime: {
        gte: today,
        lt: endViewDate,
      },
      ...locationCondition
  };

  if (!isAdminOrHead) {
      AppointmentWhereClause.barberId = dbUser.id;
  }

  const appointments = await prisma.appointment.findMany({
    where: AppointmentWhereClause,
    include: {
      service: true,
      customer: true,
      barber: true, 
      location: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const BlockedTimeWhereClause: any = {
      endTime: { gte: new Date() }
  };

  if (!isAdminOrHead) {
      BlockedTimeWhereClause.barberId = dbUser.id;
  } else {
      BlockedTimeWhereClause.barber = {
          locations: {
              some: { id: { in: queryLocationIds } }
          }
      };
  }

  const blockedTimes = await prisma.blockedTime.findMany({
    where: BlockedTimeWhereClause,
    include: {
      barber: {
          select: { name: true, image: true }
      }
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const allBarbers = isAdminOrHead ? await prisma.user.findMany({
    where: {
      role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
      userLocations: { some: { locationId: { in: queryLocationIds } } }
    },
    select: {
        id: true,
        name: true,
    }
  }) : [];

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700 space-y-16">
      
      {isAdminOrHead && (
      <div>
        <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Standort-Öffnungszeiten</h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
                Definiere die Öffnungszeiten pro Standort. Gilt für alle Barber die dem Standort zugewiesen sind.
            </p>
        </div>
        
        <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
             <AvailabilityForm currentAvailabilities={availabilitiesByLocation} availableLocations={availableLocations} />
        </div>
      </div>
      )}

      {isAdminOrHead && (
        <div>
          <div className="mb-8">
              <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Schicht-Overrides</h2>
              <p className="mt-2 text-[var(--color-text-muted)]">
                  Einmalige Standort-Zuteilungen für bestimmte Tage (z.B. Barber X muss am 15.3. in Baden aushelfen).
              </p>
          </div>
          <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
              <ShiftManager availableLocations={availableLocations} allBarbers={allBarbers} />
          </div>
        </div>
      )}

      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
             <div>
                <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">
                    {isAdminOrHead ? 'Team Termine' : 'Meine Termine'}
                </h2>
                <p className="mt-2 text-[var(--color-text-muted)]">
                    Kommende Buchungen für {queryLocationIds.length > 1 ? 'alle Standorte' : 'den gewählten Standort'}.
                </p>
             </div>
             <div className="flex items-center gap-4">
                 {queryLocationIds.length === 1 && (
                     <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold hidden md:inline-block">
                         Gefiltert
                     </span>
                 )}
                 {availableLocations.length > 1 && isAdminOrHead && (
                     <div className="relative z-20">
                         <AdminLocationFilter locations={availableLocations} />
                     </div>
                 )}
             </div>
        </div>

        <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
             <BarberSchedule 
                appointments={appointments} 
                isAdmin={isAdminOrHead} 
             />
        </div>
      </div>

      <div>
         <div className="mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--color-text)]">Abwesenheiten & Urlaub</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">
               Verwalte hier Urlaube, Krankheitsstände oder einmalige Abwesenheiten {isAdminOrHead ? 'für das Team' : 'für dich'}.
            </p>
         </div>

         <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
             <BlockedTimeManager
                existingBlocks={blockedTimes}
                allBarbers={allBarbers}
                currentUserId={dbUser.id}
                currentUserRole={dbUser.role as Role}
            />
         </div>
      </div>

    </div>
  );
}