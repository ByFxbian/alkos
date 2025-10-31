import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import ServiceManagement from '@/components/ServiceManagement';

export const revalidate = 0;

export default async function AdminServicesPage() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const services = await prisma.service.findMany({
    orderBy: {
      price: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Service-Verwaltung</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Hier kannst du die angebotenen Dienstleistungen (Haarschnitt, Bart etc.) bearbeiten.
      </p>
      <ServiceManagement services={services} />
    </div>
  );
}