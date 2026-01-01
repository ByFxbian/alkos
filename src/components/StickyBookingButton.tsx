'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type StickyBookingButtonProps = {
  locationSlug?: string;
};

export default function StickyBookingButton({ locationSlug }: StickyBookingButtonProps) {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  const getLink = (path: string) => {
        if (!locationSlug) return path;
        return `/${locationSlug}${path}`; 
    };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (pathname === '/wien/termine' || pathname === '/baden/termine' || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="fixed bottom-6 left-0 right-0 z-40 px-4 md:hidden pointer-events-none"
        >
          <div className="pointer-events-auto shadow-2xl shadow-gold-500/20 rounded-full">
            <Link
              href={getLink('/termine')}
              className="block w-full bg-gold-500 text-black font-bold text-center py-4 rounded-full text-lg active:scale-95 transition-transform"
            >
              Jetzt Termin buchen
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}