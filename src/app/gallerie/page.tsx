import Image from 'next/image';

const galleryImages = [
  { id: 1, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Frisur 1' },
  { id: 2, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Frisur 2' },
  { id: 3, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Ein Barber bei der Arbeit' },
  { id: 4, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Frisur 4' },
  { id: 5, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Bartpflege' },
  { id: 6, src: 'https://www.svgrepo.com/show/508699/landscape-placeholder.svg', alt: 'Detailaufnahme einer Rasur' },
];

export default function GalleriePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Gallerie</h1>
        <p className="mt-4 text-neutral-300 max-w-2xl mx-auto">
          Ein Einblick in unsere Kunst. Hier siehst du eine Auswahl unserer Arbeiten und die Atmosphäre in unserem Shop.
        </p>
      </div>
      
      {/* Responsives Bilder-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {galleryImages.map((image, idx) => (
          <div 
            key={image.id} 
            className={`
              ${idx % 6 === 0 || idx % 6 === 4 ? 'md:col-span-2' : ''}
              ${idx % 6 === 1 ? 'md:row-span-2' : ''}
              group overflow-hidden rounded-lg
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