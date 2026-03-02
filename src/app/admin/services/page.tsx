import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ServiceManagement from '@/components/ServiceManagement';

export const revalidate = 0;

export default async function AdminServicesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { locations: true }
  });

  if (!currentUser) {
      redirect('/api/auth/signin');
  }

  const isGlobalAdmin = currentUser.role === 'ADMIN';
  const allowedLocationIds = currentUser.locations.map(l => l.id);

  const whereClause: any = {};
  
  if (!isGlobalAdmin) {
     if (allowedLocationIds.length === 0) {
          whereClause.locationId = null;
     } else {
         whereClause.OR = [
             { locationId: null },
             { locationId: { in: allowedLocationIds } }
         ];
     }
  }

  const services = await prisma.service.findMany({
    where: whereClause,
    orderBy: {
      price: 'asc',
    },
    include: {
        location: { select: { name: true } }
    }
  });

  const availableLocations = isGlobalAdmin 
      ? await prisma.location.findMany({ select: { id: true, name: true } })
      : currentUser.locations;

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Service-Verwaltung</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
            {isGlobalAdmin 
                ? 'Verwalten Sie das globale Service-Angebot und standortspezifische Leistungen.' 
                : 'Bearbeiten Sie Services für Ihren Standort.'}
        </p>
      </div>

      <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <ServiceManagement 
            services={services} 
            availableLocations={availableLocations}
            currentUserRole={currentUser.role}
        />
      </div>
    </div>
  );
}