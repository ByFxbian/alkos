import Image from 'next/image';

const galleryImages = [
  { id: 1, src: '/images/gallery-1.jpeg', alt: 'Waschbereich' },
  { id: 2, src: '/images/gallery-2.jpeg', alt: 'Schneidebereich Neon Sign' },
  { id: 3, src: '/images/gallery-3.jpeg', alt: 'Schneidebereich 2' },
  { id: 4, src: '/images/gallery-6.jpeg', alt: 'Design Dekoration Eingangsbereich' },
  { id: 5, src: '/images/gallery-5.jpeg', alt: 'ALKOS beim Schnitt' },
  { id: 6, src: '/images/gallery-4.jpeg', alt: 'Wartebereich Fernseher' },
];

export default function GalleriePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Gallerie</h1>
        <p className="mt-4 max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
          Ein Einblick in unsere Kunst. Hier siehst du eine Auswahl unserer Arbeiten und die Atmosphäre in unserem Shop.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {galleryImages.map((image, idx) => (
          <div 
            key={image.id} 
            className={`
              ${idx % 6 === 0 || idx % 6 === 4 ? 'md:col-span-2' : ''}
              ${idx % 6 === 1 ? 'md:row-span-2' : ''}
              group overflow-hidden rounded-lg relative h-100 md:h-auto
            `}
          >
            <Image
              src={image.src}
              alt={image.alt}
              width={700}
              height={700}
              className="object-cover w-full h-full transform transition-transform duration-500 ease-in-out group-hover:scale-110"
            />
          </div>
        ))}
      </div>
    </div>
  );
}