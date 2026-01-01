import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/StatCard';
import RevenueChart from '@/components/RevenueChart';
import Image from 'next/image';

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { locations: true },
  });

  if (!currentUser) {
    redirect('/api/auth/signin');
  }

  const authorizedLocationIds = currentUser.role === 'ADMIN' 
    ? undefined 
    : currentUser.locations.map(loc => loc.id);
  
  if (currentUser.role === 'HEADOFBARBER' && (!authorizedLocationIds || authorizedLocationIds.length === 0)) {
     return (
        <div className="p-8 text-center text-red-500">
            <h1 className="text-xl font-bold">Kein Standort zugewiesen</h1>
            <p>Bitte kontaktieren Sie einen Administrator.</p>
        </div>
     );
  }

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const locationFilter = authorizedLocationIds 
    ? { locationId: { in: authorizedLocationIds } } 
    : {};
  
  const userLocationFilter = authorizedLocationIds
    ? { locations: { some: { id: { in: authorizedLocationIds } } } }
    : {};

  const [
    barbers,
    appointmentsNext7Days,
    newCustomersLast30Days,
    popularServices
  ] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] },
        ...userLocationFilter,
      },
      select: { id: true, name: true, image: true }
    }),

    prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lt: sevenDaysFromNow,
        },
        ...locationFilter,
      },
      include: {
        service: {
          select: { price: true, name: true }
        },
        barber: {
          select: { id: true, name: true }
        },
        location: { 
            select: { name: true }
        }
      }
    }),

    prisma.user.count({
      where: {
        role: 'KUNDE',
        createdAt: {
          gte: thirtyDaysAgo,
        },
      }
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

  const serviceCountMap: Record<string, number> = {};
  for (const app of appointmentsNext7Days) {
    const sName = app.service.name;
    serviceCountMap[sName] = (serviceCountMap[sName] || 0) + 1;
  }
  
  const popularServiceStats = Object.entries(serviceCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  let appointmentsCountNext7Days = appointmentsNext7Days.length;

  const servicePopularity: Record<string, { count: number, name: string }> = {};
  for (const app of appointmentsNext7Days) {
    const sId = app.service.name; 
    if (!servicePopularity[sId]) {
        servicePopularity[sId] = { count: 0, name: app.service.name };
    }
    servicePopularity[sId].count++;
  }

  let totalAppointments = 0;
  let totalRevenue = 0;

  for (const app of appointmentsNext7Days) {
    totalAppointments++;
    totalRevenue += app.service.price;
  }

  const barberStatsMap: Record<string, { name: string, image: string | null, appointments: number, revenue: number }> = {};
  barbers.forEach(b => {
      barberStatsMap[b.id] = { name: b.name || 'Unbekannt', image: b.image, appointments: 0, revenue: 0 };
  });

  for (const app of appointmentsNext7Days) {
     if (barberStatsMap[app.barberId]) {
         barberStatsMap[app.barberId].appointments++;
         barberStatsMap[app.barberId].revenue += app.service.price;
     }
  }

  const barberStatsArray = Object.values(barberStatsMap).sort((a,b) => b.revenue - a.revenue);

  const mostPopularService = Object.values(servicePopularity).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700 space-y-12">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Dashboard</h1>
            <p className="mt-2 text-[var(--color-text-muted)]">
                Willkommen zurück, {session.user.name}.
                {authorizedLocationIds ? ' Standort-Ansicht.' : ' Gesamtübersicht.'}
            </p>
        </div>
        {authorizedLocationIds && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                Gefiltert: {authorizedLocationIds.length} Standort(e)
            </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Kommende Termine" 
          value={appointmentsCountNext7Days.toString()} 
          subtext="Nächste 7 Tage" 
        />
        <StatCard 
          title="Erwarteter Umsatz" 
          value={`${totalRevenue.toFixed(2)} €`} 
          subtext="Nächste 7 Tage (Prognose)" 
        />
        <StatCard 
          title="Neue Kunden" 
          value={newCustomersLast30Days.toString()} 
          subtext="Letzte 30 Tage (Global)" 
        />
        <StatCard 
            title="Top Service" 
            value={mostPopularService ? mostPopularService.name : '-'} 
            subtext={mostPopularService ? `${mostPopularService.count} Buchungen` : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[var(--color-text)]">
                Team Performance
                <span className="text-xs font-normal text-[var(--color-text-muted)] ml-2">(7 Tage)</span>
            </h2>

            <div className="hidden md:block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                    <thead className="bg-[var(--color-surface-3)]">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Mitarbeiter</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Termine</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Umsatz</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {barberStatsArray.map((barber) => (
                            <tr key={barber.name} className="hover:bg-[var(--color-surface-3)] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)] flex items-center gap-3">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)]">
                                        {barber.image ? (
                                            <Image src={barber.image} alt={barber.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-xs">
                                                {barber.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    {barber.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">{barber.appointments}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-text)]">{barber.revenue.toFixed(2)} €</td>
                            </tr>
                        ))}
                        {barberStatsArray.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)]">Keine Daten für diesen Zeitraum.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden space-y-4">
                {barberStatsArray.map((barber) => (
                <div key={barber.name} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform">
                    <div className="flex items-center gap-4">
                         <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-inner">
                            {barber.image ? (
                                <Image src={barber.image} alt={barber.name} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] font-bold">
                                    {barber.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-[var(--color-text)]">{barber.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{barber.appointments} Termine</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-[var(--color-gold-500)] text-lg">{barber.revenue.toFixed(2)} €</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Umsatz</p>
                    </div>
                </div>
                ))}
            </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
             <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Umsatzverlauf</h2>
             <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm min-h-[300px]">
                 <RevenueChart barbers={barbers} />
             </div>
        </div>
      </div>
    </div>
  );
}