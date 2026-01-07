'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type SimpleLocation = {
  id: string;
  name: string;
  slug: string;
  city: string;
  heroImage: string | null;
};

export default function GatewayPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<SimpleLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedLocationSlug, setSavedLocationSlug] = useState<string | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('alkos-location');
    if (saved) {
        setSavedLocationSlug(saved);
    }

    fetch('/api/public/location-data')
      .then(res => res.json())
      .then(data => {
        setLocations(data.locations);
        setTimeout(() => setLoading(false), 800);
      });
  }, []);

  const handleSelect = (slug: string) => {
    localStorage.setItem('alkos-location', slug);
    router.push(`/${slug}`);
  };

  const savedLocationObj = locations.find(l => l.slug === savedLocationSlug);

  const isRedTheme = hoveredLocation === 'baden';
  const themeStyle = isRedTheme ? {
      '--color-gold-500': '#ef4444',
      '--color-gold-400': '#f87171',
  } as React.CSSProperties : {};

  if (loading) return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center z-50">
          <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
             className="w-24 h-24 border-4 border-gold-500 rounded-full border-t-transparent animate-spin"
          />
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-gold-500 font-serif tracking-widest uppercase text-sm"
          >
            Lade Experience...
          </motion.p>
      </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center p-4 transition-colors duration-500" style={themeStyle}>
      <div className="absolute inset-0 opacity-40">
         <Image src="/images/hero-bg.jpeg" alt="Background" fill className="object-cover blur-md scale-110 animate-pulse [animation-duration:7s]" />
      </div>
      
      <div className="relative z-10 w-full max-w-5xl">
        
        <AnimatePresence>
            {savedLocationObj && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mb-8 mx-auto max-w-md bg-white/10 backdrop-blur-md border border-gold-500/30 p-4 rounded-xl text-center"
                >
                    <p className="text-neutral-300 text-xs uppercase tracking-widest mb-2">Willkommen zurück</p>
                    <div className="flex items-center justify-between gap-4">
                        <div className="text-left">
                           <p className="text-white font-bold text-lg">{savedLocationObj.city}</p>
                           <p className="text-gold-500 text-xs">{savedLocationObj.name}</p>
                        </div>
                        <button 
                            onClick={() => handleSelect(savedLocationObj.slug)}
                            className="bg-gold-500 hover:bg-gold-400 text-black font-bold px-6 py-2 rounded-lg text-sm transition-colors"
                        >
                            Weiter &rarr;
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
        >
            <h1 className="text-5xl md:text-8xl font-extrabold text-white mb-6 tracking-tighter drop-shadow-2xl">
                ALKOS <span className="text-gold-500 transition-colors duration-500">BARBER</span>
            </h1>
            <p className="text-xl md:text-2xl text-neutral-300 uppercase tracking-widest font-light">
                Wähle deine Location
            </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
            {locations.map((loc, idx) => (
                <motion.div
                    key={loc.id}
                    initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + (idx * 0.1), duration: 0.6 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(loc.slug)}
                    onMouseEnter={() => setHoveredLocation(loc.slug)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    className="group cursor-pointer relative h-72 md:h-96 rounded-3xl overflow-hidden border border-white/10 hover:border-gold-500 transition-colors duration-500 shadow-2xl"
                >
                    <Image 
                        src={loc.heroImage || '/images/hero-bg.jpeg'} 
                        alt={loc.name} 
                        fill 
                        className="object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1 grayscale group-hover:grayscale-0"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-500" />

                    <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-gold-500 group-hover:text-black transition-colors duration-300">
                        <svg className="w-6 h-6 text-white group-hover:text-black transform -rotate-45 group-hover:rotate-0 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </div>

                    <div className="absolute bottom-0 left-0 w-full p-10 text-left">
                        <h2 className="text-4xl font-bold text-white mb-2 group-hover:text-gold-500 transition-colors">{loc.city}</h2>
                        <p className="text-neutral-300 text-sm font-medium tracking-wide border-l-2 border-gold-500 pl-3">{loc.name}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}