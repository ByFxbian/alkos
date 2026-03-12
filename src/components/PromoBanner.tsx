'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const PROMO_START_DATE = '2026-03-07';
const PROMO_END_DATE = '2026-03-14';
const PROMO_STORAGE_KEY = 'hidePromoBanner_0314';

export default function PromoBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [timeLabel, setTimeLabel] = useState('');
  const pathname = usePathname();


  const isHiddenRoute = pathname === '/walkin' || pathname.startsWith('/admin');

  useEffect(() => {
    if (isHiddenRoute) return;

    if (sessionStorage.getItem(PROMO_STORAGE_KEY) === 'true') return;

    const now = new Date();
    const promoStart = new Date(PROMO_START_DATE + 'T00:00:00+01:00');
    const promoEnd = new Date(PROMO_END_DATE + 'T23:59:59+01:00');


    if (now > promoEnd) return;

    if (now < promoStart) {
      setTimeLabel(`📅 Ab 7. März`);
    } else {
      setTimeLabel('✨ AKTION');
    }

    setIsVisible(true);
  }, [isHiddenRoute]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem(PROMO_STORAGE_KEY, 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12"
                animate={{ x: ['-200%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                style={{ width: '50%' }}
              />
            </div>

            <div className="relative px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <motion.span
                  className="font-black text-sm sm:text-base tracking-wide"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {timeLabel}:
                </motion.span>
                <span className="font-bold text-sm sm:text-base">
                  Alle Haarschnitte nur <span className="text-lg sm:text-xl font-black">5€</span> bei ALKOS Baden bis zum 14. März!
                </span>
                <span className="text-xs sm:text-sm font-medium opacity-80">
                  Eröffnungsangebot 🎉
                </span>
              </div>

              <Link
                href="/baden/termine"
                className="inline-flex items-center gap-1.5 bg-black text-yellow-400 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full hover:bg-neutral-900 transition-colors whitespace-nowrap shadow-lg"
              >
                Jetzt buchen →
              </Link>

              <button
                onClick={handleDismiss}
                className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 p-1.5 hover:opacity-70 transition-opacity"
                aria-label="Banner schließen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
