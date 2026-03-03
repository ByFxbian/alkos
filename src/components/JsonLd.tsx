import { prisma } from '@/lib/prisma';

export default async function JsonLd() {
  const locations = await prisma.location.findMany({
    select: {
      name: true,
      slug: true,
      address: true,
      city: true,
      postalCode: true,
      phone: true,
      email: true,
      description: true,
    },
  });

  const schemas = locations.map((loc) => ({
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "name": `ALKOS ${loc.name}`,
    "image": "https://alkosbarber.at/images/hero-bg.jpeg",
    "description": loc.description || `Premium Barber Shop in ${loc.city}. Buche jetzt deinen Termin online.`,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": loc.address,
      "addressLocality": loc.city,
      "postalCode": loc.postalCode,
      "addressCountry": "AT"
    },
    "url": `https://alkosbarber.at/${loc.slug}`,
    ...(loc.phone ? { "telephone": loc.phone } : {}),
    ...(loc.email ? { "email": loc.email } : {}),
    "priceRange": "$$",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        "opens": "09:00",
        "closes": "20:00"
      },
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": "Saturday",
        "opens": "09:00",
        "closes": "18:00"
      }
    ]
  }));

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
