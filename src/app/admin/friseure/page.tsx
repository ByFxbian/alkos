import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export const revalidate = 0;

export default async function FriseurAdminPage() {
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
          return (
             <div className="p-12 text-center">
                 <h1 className="text-xl font-bold text-red-500">Keine Berechtigung</h1>
                 <p className="text-muted-foreground">Diesem Account ist kein Standort zugewiesen.</p>
             </div>
          );
      }

      whereClause.locations = {
          some: {
              id: { in: allowedLocationIds }
          }
      };
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    orderBy: {
      role: 'asc',
    },
    include: { 
        locations: { select: { id: true, name: true } }
    }
  });

  const availableLocations = isGlobalAdmin 
      ? await prisma.location.findMany({ select: { id: true, name: true } })
      : currentUser.locations;

  return (
    <div className="container mx-auto py-12 px-4 animate-in fade-in duration-700">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Team & Benutzer</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">
            {isGlobalAdmin 
                ? 'Verwalten Sie alle Benutzer und Mitarbeiter aller Standorte.' 
                : 'Verwalten Sie Mitarbeiter und Kunden Ihres Standortes.'}
        </p>
      </div>
      
      <div className="bg-[var(--color-surface-2)] p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <UserManagement 
            allUsers={users} 
            currentUserId={session.user.id} 
            availableLocations={availableLocations}
            currentUserRole={currentUser.role}
        />
      </div>
    </div>
  );
}