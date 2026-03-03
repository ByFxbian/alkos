import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://alkosbarber.at';

    const locations = await prisma.location.findMany({
        select: { slug: true, updatedAt: true },
    });

    const staticPages: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: `${baseUrl}/login`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.3,
        },
    ];

    const locationPages: MetadataRoute.Sitemap = locations.flatMap((loc) => [
        {
            url: `${baseUrl}/${loc.slug}`,
            lastModified: loc.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.9,
        },
        {
            url: `${baseUrl}/${loc.slug}/termine`,
            lastModified: loc.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.8,
        },
        {
            url: `${baseUrl}/${loc.slug}/team`,
            lastModified: loc.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.6,
        },
        {
            url: `${baseUrl}/${loc.slug}/gallerie`,
            lastModified: loc.updatedAt,
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ]);

    return [...staticPages, ...locationPages];
}
