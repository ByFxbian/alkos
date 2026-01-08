import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AvailabilityForm from '@/components/AvailabilityForm';
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
      include: { locations: { select: { id: true, name: true } } }
  });

  if (!dbUser) {
      redirect('/api/auth/signin');
  }
  
  const isGlobalAdmin = dbUser.role === 'ADMIN';
  
  let availableLocations: {id: string, name: string}[] = [];
  if (isGlobalAdmin) {
      availableLocations = await prisma.location.findMany({ select: { id: true, name: true } });
  } else {
      availableLocations = dbUser.locations;
  }

  const allowedLocationIds = isGlobalAdmin
      ? availableLocations.map(l => l.id)
      : dbUser.locations.map(l => l.id);

  const cookieStore = await cookies();
  const filterId = cookieStore.get('admin_location_filter')?.value;
  
  let queryLocationIds = allowedLocationIds;
  if (filterId && filterId !== 'ALL') {
      if (allowedLocationIds.includes(filterId)) {
          queryLocationIds = [filterId];
      }
  }

  const availabilities = await prisma.availability.findMany({
    where: { barberId: dbUser.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  const endViewDate = new Date(today);
  endViewDate.setDate(today.getDate() + 7);

  const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(dbUser.role);

  const AppointmentWhereClause: any = {
      startTime: {
        gte: today,
        lt: endViewDate,
      },
      locationId: { in: queryLocationIds }
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
      locations: { some: { id: { in: queryLocationIds } } }
    },
    select: {
        id: true,
        name: true,
    }
  }) : [];

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700 space-y-16">
      
      <div>
        <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Meine Arbeitszeiten</h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
                Definiere hier deine regulären Wochenarbeitszeiten. Diese gelten allgemein für dich.
            </p>
        </div>
        
        <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
             <AvailabilityForm currentAvailabilities={availabilities} />
        </div>
      </div>

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