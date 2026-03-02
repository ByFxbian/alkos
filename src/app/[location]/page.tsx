import { notFound } from 'next/navigation';
import HomepageClient from '@/components/HomepageClient';
import { prisma } from '@/lib/prisma';

async function getLocationData(slug: string) {
  const location = await prisma.location.findUnique({
    where: { slug },
    include: {
      teamMembers: { orderBy: { sortOrder: 'asc' } }
    }
  });
  return location;
}

export default async function LocationHomepage({ params }: { params: Promise<{ location: string }> }) {
  const { location: slug } = await params;
  const locationData = await getLocationData(slug);

  if (!locationData) {
    return notFound();
  }

  return (
    <HomepageClient 
        location={locationData} 
        teamMembers={locationData.teamMembers} 
    />
  );
}