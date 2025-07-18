import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AvailabilityForm from '@/components/AvailabilityForm';
import BarberSchedule from '@/components/BarberSchedule';

export default async function KalenderAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session ||!['ADMIN', 'FRISEUR'].includes(session.user.role)) {
    redirect('/login');
  }

  const availabilities = await prisma.availability.findMany({
    where: { barberId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const appointments = await prisma.appointment.findMany({
    where: {
      // Wenn der User ein ADMIN ist, lade alle Termine.
      // Ansonsten lade nur die Termine des eingeloggten Friseurs.
      barberId: session.user.role === 'ADMIN' ? undefined : session.user.id,
      startTime: {
        gte: new Date(), // Nur zukünftige Termine
      },
    },
    include: {
      service: true,
      customer: true,
      barber: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  return (
    <div className="container mx-auto py-12 px-4">
      {/* Arbeitszeiten-Formular (bleibt wie es ist) */}
      <h1 className="text-4xl font-bold tracking-tight mb-2">Meine Arbeitszeiten</h1>
      <p className="text-neutral-400 mb-8">
        Lege hier deine wöchentlichen Arbeitszeiten fest.
      </p>
      <AvailabilityForm currentAvailabilities={availabilities} />
      
      {/* Neue Sektion für die Terminübersicht */}
      <div className="mt-16">
        <h2 className="text-4xl font-bold tracking-tight mb-8">Anstehende Termine</h2>
        <BarberSchedule appointments={appointments} isAdmin={session.user.role === 'ADMIN'} />
      </div>
    </div>
  );
}