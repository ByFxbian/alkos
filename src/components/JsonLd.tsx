export default function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "name": "ALKOS Barber",
    "image": "https://alkosbarber.at/images/hero-bg.jpeg",
    "description": "Premium Barber Shop in Wien. Buche jetzt deinen Termin online.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Wiedner Gürtel 12",
      "addressLocality": "Wien",
      "postalCode": "1040",
      "addressCountry": "AT"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 48.185, 
      "longitude": 16.375 
    },
    "url": "https://alkosbarber.at",
    "telephone": "+43123456789", 
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
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
