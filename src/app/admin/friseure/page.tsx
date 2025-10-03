import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export default async function FriseurAdminPage() {
  const session = await getServerSession(authOptions);

  if (!session || !['ADMIN', 'HEADOFBARBER'].includes(session.user.role)) {
    redirect('/');
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Benutzerverwaltung</h1>
      <UserManagement allUsers={users} currentUserId={session.user.id} />
    </div>
  );
}