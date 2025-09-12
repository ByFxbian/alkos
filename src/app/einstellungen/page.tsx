import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import SettingsForm from '@/components/SettingsForm';

export default async function EinstellungenPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/einstellungen');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!currentUser) {
    redirect('/login');
  }

  const userData = {
    name: currentUser.name || '',
    email: currentUser.email,
    instagram: currentUser.instagram || '',
    imageUrl: currentUser.imageUrl || '',
    bio: currentUser.bio || '',
    emailVerified: currentUser.emailVerified,
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Einstellungen</h1>
      <SettingsForm user={userData} />
    </div>
  );
}