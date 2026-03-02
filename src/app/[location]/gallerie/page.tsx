import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export default async function GalleriePage({ params }: { params: Promise<{ location: string }> }) {
  const { location: slug } = await params;
  
  const locationObj = await prisma.location.findUnique({
    where: { slug }
  });

  if (!locationObj) {
    return notFound();
  }

  const galleryImages = locationObj.galleryImages || [];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Gallerie ({locationObj.name})</h1>
        <p className="mt-4 max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          Ein Einblick in unsere Kunst. Hier siehst du eine Auswahl unserer Arbeiten und die Atmosphäre in unserem Shop.
        </p>
      </div>

      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {galleryImages.map((src, idx) => (
            <div 
              key={idx} 
              className={`
                ${idx % 6 === 0 || idx % 6 === 4 ? 'md:col-span-2' : ''}
                ${idx % 6 === 1 ? 'md:row-span-2' : ''}
                group overflow-hidden rounded-lg relative h-[300px] md:h-auto
              `}
            >
              <Image
                src={src}
                alt={`Gallerie Bild ${idx + 1}`}
                width={700}
                height={700}
                className="object-cover w-full h-full transform transition-transform duration-500 ease-in-out group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-neutral-500 mt-20 text-lg">
          Noch keine Bilder für diesen Standort hochgeladen.
        </p>
      )}
    </div>
  );
}