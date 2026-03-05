'use client';

type LocationMapProps = {
    googleMapsUrl?: string | null;
    address: string;
    city: string;
    postalCode: string;
};

export default function LocationMap({ googleMapsUrl, address, city, postalCode }: LocationMapProps) {

  const encodedAddress = encodeURIComponent(`${address}, ${postalCode} ${city}`);
  const mapSrc = googleMapsUrl || `https://maps.google.com/maps?width=100%25&height=600&hl=de&q=${encodedAddress}+(ALKOS+Barber)&t=&z=15&ie=UTF8&iwloc=B&output=embed`;


  const directionsUrl = `https://www.google.com/maps/dir//${encodeURIComponent(`ALKOS Barber ${address} ${postalCode} ${city}`)}`;

  return (
    <div className="w-full h-[400px] relative rounded-xl overflow-hidden border border-neutral-800 shadow-2xl">
      <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 max-w-xs">
        <h3 className="text-gold-500 font-bold text-lg">ALKOS Barber</h3>
        <p className="text-neutral-300 text-sm mt-1">
          {address}<br />
          {postalCode} {city}
        </p>
        <a 
          href={directionsUrl}
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-white underline mt-2 block hover:text-gold-500"
        >
          Route planen →
        </a>
      </div>

      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        title="Barber Location"
        src={mapSrc}
        className="filter grayscale contrast-125 brightness-75 invert transition-all duration-500"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    </div>
  );
}