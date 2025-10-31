import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import StatCard from '@/components/StatCard';
import { Role } from '@/generated/prisma';

export const revalidate = 60;

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [barbers, appointmentsNext7Days, newCustomerCount, allServices] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] }
      },
      select: { id: true, name: true }
    }),

    prisma.appointment.findMany({
      where: {
        startTime: {
          gte: now,
          lt: sevenDaysFromNow,
        },
      },
      include: {
        service: {
          select: { price: true, name: true }
        },
        barber: {
          select: { id: true, name: true }
        },
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
        select: { id: true, name: true }
    })
  ]);

  type BarberStats = {
    name: string;
    revenue: number;
    appointmentCount: number;
  };

  const statsByBarber: Record<string, BarberStats> = {};

  for (const barber of barbers) {
    statsByBarber[barber.id] = {
      name: barber.name || 'Unbekannt',
      revenue: 0,
      appointmentCount: 0,
    };
  }

  let totalAppointments = 0;

  for (const app of appointmentsNext7Days) {
    totalAppointments++;
    const revenue = app.isFree ? 0 : app.service.price;

    if (statsByBarber[app.barberId]) {
      statsByBarber[app.barberId].revenue += revenue;
      statsByBarber[app.barberId].appointmentCount += 1;
    }
  }

  const barberStatsArray = Object.values(statsByBarber).sort((a, b) => b.revenue - a.revenue);

  // B) Beliebtester Service
  const servicePopularity: Record<string, { name: string, count: number }> = {};
  allServices.forEach(s => {
    servicePopularity[s.id] = { name: s.name, count: 0 };
  });

  appointmentsNext7Days.forEach(app => {
    if(servicePopularity[app.serviceId]) {
        servicePopularity[app.serviceId].count += 1;
    }
  });

  const mostPopularService = Object.values(servicePopularity).sort((a, b) => b.count - a.count)[0];

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Dashboard</h1>

      {/* Grid für die Haupt-Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <StatCard 
          title="Termine (Nächste 7 Tage)" 
          value={totalAppointments}
          description="Gesamtanzahl gebuchter Termine"
        />
        <StatCard 
          title="Neue Kunden" 
          value={newCustomerCount}
          description="Anmeldungen in den letzten 30 Tagen"
        />
        <StatCard 
          title="Top Service (Nächste 7 Tage)" 
          value={mostPopularService?.name || 'N/A'}
          description={mostPopularService?.count > 0 ? `${mostPopularService.count} mal gebucht` : 'Keine Buchungen'}
        />
      </div>

      {/* Sektion für Barber-Umsatz */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Umsatz & Termine (Nächste 7 Tage)</h2>
        <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-3)'}}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Barber</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Termine (Anzahl)</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Vorauss. Umsatz</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {barberStatsArray.map((barber) => (
                <tr key={barber.name}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{barber.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{barber.appointmentCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{barber.revenue.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}