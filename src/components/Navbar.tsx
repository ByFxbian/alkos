'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type NavbarProps = {
    locationSlug?: string;
};

type SimpleLoc = { slug: string; name: string; city: string; };

export default function Navbar({ locationSlug }: NavbarProps) {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [locations, setLocations] = useState<SimpleLoc[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileLocationOpen, setIsMobileLocationOpen] = useState(false);

  useEffect(() => {
    fetch('/api/public/location-data')
      .then(r => r.json())
      .then(d => {
        const locs = d.locations || d;
        if(Array.isArray(locs)) setLocations(locs);
      })
      .catch(e => console.error("Nav Load Error", e));
  }, []);

  const handleLocationSwitch = (slug: string) => {
    localStorage.setItem('alkos-location', slug);
    setIsMobileMenuOpen(false);
    if (locationSlug) {
        const newPath = pathname.replace(`/${locationSlug}`, `/${slug}`);
        router.push(newPath);
    } else {
        router.push(`/${slug}`);
    }
  };

  const getLink = (path: string) => {
        if (!locationSlug) return path;
        return `/${locationSlug}${path}`;
    };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const activeLocation = locations.find(l => l.slug === locationSlug);
  const activeLocationName = activeLocation ? activeLocation.city : "Standort";

  return (
    <header className="backdrop-blur-sm sticky top-0 z-50 border-b" style={{
        backgroundColor: `var(--color-surface-rgb)`,
        borderColor: 'var(--color-border)'
      }}>
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href={locationSlug ? `/${locationSlug}` : '/'} className="text-xl font-bold  hover:text-gold-500 transition-colors">
          ALKOS
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          <div className="relative group py-4">
                <button className="flex items-center gap-1 font-bold text-sm uppercase hover:text-gold-500 transition-colors">
                    📍 {activeLocationName}
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div className="absolute top-full left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 transform origin-top pt-2">
                    <div className="py-1">
                        {locations.map(loc => (
                            <button 
                                key={loc.slug}
                                onClick={() => handleLocationSwitch(loc.slug)}
                                className={`block w-full text-left px-4 py-3 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors ${locationSlug === loc.slug ? 'text-gold-500 font-bold' : ''}`}
                            >
                                {loc.city} 
                                <span className="block text-[10px] text-neutral-500 font-normal">{loc.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

          <Link href={getLink('/termine')} className="hover:text-gold-500 transition-colors">Termine</Link>
          <Link href={getLink('/team')} className="hover:text-gold-500 transition-colors">Team</Link>
          <Link href={getLink('/gallerie')} className="hover:text-gold-500 transition-colors">Gallerie</Link>
          <Link href={getLink('/fehler-melden')} className="text-sm hover:text-gold-500 transition-colors text-red-400">Fehler melden</Link>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="hidden md:block w-28 text-right">
            {status === 'loading' && (
              <div className="h-9 w-9 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-surface)'}}></div>
            )}

            {status === 'unauthenticated' && (
              <Link href="/login" className="bg-white text-black font-semibold px-4 py-2 rounded-md hover:bg-gold-500 transition-colors">
                Login
              </Link>
            )}

            {status === 'authenticated' && (
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-gold-500 text-black w-9 h-9 rounded-full flex items-center justify-center font-bold">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </button>
                
                <div className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg py-1 transition-all duration-300 ${isDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`} style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)'}}>
                  <p className="px-4 py-2 text-sm truncate" style={{color: 'var(--color-text-muted)'}}>Hallo, {session.user?.name}</p>
                  <hr style={{ borderColor: 'var(--color-border)' }} />

                  <Link href="/meine-termine" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Meine Termine</Link>
                  <Link href="/einstellungen" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Einstellungen</Link>

                  {(session.user?.role === 'BARBER' || session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                      <Link href="/admin/kalender" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Terminkalender</Link>
                  )}
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                      <Link href="/admin/friseure" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Nutzer verwalten</Link>
                  )}
                  {(session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                    <Link href="/admin/services" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Services verwalten</Link>
                  )}

                  {(session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                      <Link href="/admin/dashboard" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Dashboard</Link>
                  )}

                  {(session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                      <Link href="/admin/web-team" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Teammitglieder</Link>
                  )}

                  {(session.user?.role === 'ADMIN') && (
                      <Link href="/admin/locations" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Locations</Link>
                  )}
                  
                  <hr className=" my-1" style={{ borderColor: 'var(--color-border)' }}/>
                  <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-red-500 hover:text-white">
                      Abmelden
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menü öffnen" className="relative z-50 p-2">
               {isMobileMenuOpen ? (
                   <span className="text-2xl font-bold">✕</span>
               ) : (
                   <svg className="w-8 h-8 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
               )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-40 bg-[var(--color-bg)]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:hidden"
            >
                <div className="space-y-6 text-center w-full max-w-sm">
                    
                    <div className="mb-8">
                        <button 
                            onClick={() => setIsMobileLocationOpen(!isMobileLocationOpen)}
                            className="bg-[var(--color-surface-2)] p-4 rounded-xl w-full flex items-center justify-between border border-[var(--color-border)]"
                        >
                            <span className="font-bold text-lg uppercase flex items-center gap-2">
                                📍 {activeLocationName}
                            </span>
                            <span className={`transform transition-transform ${isMobileLocationOpen ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                        
                        <AnimatePresence>
                            {isMobileLocationOpen && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden mt-2 space-y-2 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]"
                                >
                                    {locations.map(loc => (
                                        <button 
                                            key={loc.slug}
                                            onClick={() => handleLocationSwitch(loc.slug)}
                                            className="w-full text-left px-4 py-3 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                                        >
                                            <div className={`font-bold ${locationSlug === loc.slug ? 'text-gold-500' : ''}`}>{loc.city}</div>
                                            <div className="text-xs opacity-60">{loc.name}</div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <nav className="flex flex-col gap-4 text-2xl font-bold">
                        <Link href={getLink('/termine')} className="hover:text-gold-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Termine</Link>
                        <Link href={getLink('/team')} className="hover:text-gold-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Team</Link>
                        <Link href={getLink('/gallerie')} className="hover:text-gold-500 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Gallerie</Link>
                    </nav>

                    <div className="pt-8 border-t border-[var(--color-border)] w-full">
                         {status === 'authenticated' ? (
                             <div className="space-y-4">
                                 <p className="text-sm opacity-60">Hallo, {session.user?.name}</p>
                                 <Link href="/meine-termine" className="block w-full py-3 bg-[var(--color-surface-2)] rounded-lg font-bold" onClick={() => setIsMobileMenuOpen(false)}>Meine Termine</Link>
                                 <button onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }} className="text-red-500 text-sm font-bold uppercase tracking-widest">Abmelden</button>
                             </div>
                         ) : (
                             <Link href="/login" className="block w-full py-4 bg-gold-500 text-black font-bold text-lg rounded-xl shadow-lg shadow-gold-500/20" onClick={() => setIsMobileMenuOpen(false)}>
                                 Login
                             </Link>
                         )}
                    </div>

                    <div className="absolute bottom-8 left-0 w-full text-center">
                        <Link href={getLink('/fehler-melden')} className="text-xs text-red-400 hover:text-red-300" onClick={() => setIsMobileMenuOpen(false)}>Fehler melden</Link>
                    </div>

                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
