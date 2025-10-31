import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import AvailabilityForm from '@/components/AvailabilityForm';
import BarberSchedule from '@/components/BarberSchedule';
import { Role } from '@/generated/prisma';
import { BlockedTimeManager } from '@/components/BlockedTimeManager';

export default async function KalenderAdminPage() {
  const session = await getServerSession(authOptions);

  const allowedRoles = ['ADMIN', 'BARBER', 'HEADOFBARBER'];
  if (!session ||!allowedRoles.includes(session.user.role)) {
    redirect('/login');
  }

  const availabilities = await prisma.availability.findMany({
    where: { barberId: session.user.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const today = new Date();
  today.setHours(0,0,0,0);
  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  const isAdminOrHead = ['ADMIN', 'HEADOFBARBER'].includes(session.user.role);

  const appointments = await prisma.appointment.findMany({
    where: {
      /*...(session.user.role === 'ADMIN' && {}),
      ...(session.user.role === 'HEADOFBARBER' && {}),
      ...(session.user.role === 'BARBER' && {barberId: session.user.id}),*/
      ...(isAdminOrHead ? {} : { barberId: session.user.id }),
      startTime: {
        gte: today,
        lt: sevenDaysFromNow,
      },
    },
    include: {
      service: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          instagram: true,
          completedAppointments: true,
        }
      },
      barber: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const blockedTimes = await prisma.blockedTime.findMany({
    where: {
      ...(isAdminOrHead ? {} : { barberId: session.user.id }),
      endTime: {
          gte: new Date(),
      },
    },
    include: {
      barber: {
          select: { name: true }
      }
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const allBarbers = isAdminOrHead ? await prisma.user.findMany({
    where: {
        role: { in: ['BARBER', 'HEADOFBARBER', 'ADMIN'] }
    },
    select: {
        id: true,
        name: true,
    }
  }) : [];

  const canManageAppointments = (session.user.role === 'ADMIN' || session.user.role === 'HEADOFBARBER' || session.user.role === 'BARBER');

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-2">Meine Arbeitszeiten</h1>
      <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
        Lege hier deine wöchentlichen Arbeitszeiten fest.
      </p>
      <AvailabilityForm currentAvailabilities={availabilities} />

      <div className="mt-16">
        <h2 className="text-4xl font-bold tracking-tight mb-2">Abwesenheiten (Urlaub, etc.)</h2>
        <p className="mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Trage hier einzelne Tage oder Zeiträume ein, an denen du nicht verfügbar bist.
        </p>
        <BlockedTimeManager
          existingBlocks={blockedTimes}
          allBarbers={allBarbers}
          currentUserId={session.user.id}
          currentUserRole={session.user.role as Role}
        />
      </div>

      <div className="mt-16">
        <h2 className="text-4xl font-bold tracking-tight mb-8">Heutige Termine</h2>
        <BarberSchedule appointments={appointments} isAdmin={canManageAppointments} />
      </div>
    </div>
  );
}