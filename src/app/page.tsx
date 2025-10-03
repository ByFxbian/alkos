import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';
import HomepageClient from '@/components/HomepageClient';

export default async function Home() {

  return <HomepageClient/>;
}