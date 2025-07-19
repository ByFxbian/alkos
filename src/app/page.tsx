import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';
import HomepageClient from '@/components/HomepageClient';

export default async function Home() {
  const barbers = await prisma.user.findMany({
    where: { role: Role.FRISEUR },
    take: 3,
  });

  return <HomepageClient barbers={barbers} />;
}