import { notFound } from 'next/navigation';
import HomepageClient from '@/components/HomepageClient';
import { prisma } from '@/lib/prisma';
import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ location: string }> }): Promise<Metadata> {
  const { location: slug } = await params;
  const loc = await prisma.location.findUnique({
    where: { slug },
    select: { name: true, city: true, description: true, heroImage: true },
  });

  if (!loc) return {};

  const title = `ALKOS ${loc.name} | Premium Barber ${loc.city}`;
  const description = loc.description || `Premium Barber Shop in ${loc.city}. Buche jetzt deinen Termin online bei ALKOS ${loc.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://alkosbarber.at/${slug}`,
      images: [{ url: loc.heroImage || 'https://alkosbarber.at/images/hero-bg.jpeg', width: 1200, height: 630 }],
    },
  };
}
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