'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <header className="backdrop-blur-sm sticky top-0 z-50 border-b" style={{
        backgroundColor: `var(--color-surface-rgb)`,
        borderColor: 'var(--color-border)'
      }}>
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-bold  hover:text-gold-500 transition-colors">
          ALKOS
        </Link>

        <div className="hidden md:flex items-center space-x-6">
          <Link href="/termine" className="hover:text-gold-500 transition-colors">Termine</Link>
          <Link href="/team" className="hover:text-gold-500 transition-colors">Team</Link>
           <Link href="/gallerie" className="hover:text-gold-500 transition-colors">Gallerie</Link>
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
                      <Link href="/admin/friseure" className="block px-4 py-2 text-sm hover:bg-gold-500 hover:text-black">Mitarbeiter bearbeiten</Link>
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
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Menü öffnen">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>
        </div>
      </nav>

      <div 
        className={`md:hidden absolute w-full backdrop-blur-lg transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)'}} >
        <div className="flex flex-col items-center space-y-4 py-6 border-t"style={{
          borderColor: 'var(--color-border)'
        }}
        >
          <Link href="/termine" className="hover:text-gold-500" onClick={() => setIsMobileMenuOpen(false)}>Termine</Link>
          <Link href="/team" className="hover:text-gold-500" onClick={() => setIsMobileMenuOpen(false)}>Team</Link>
          <Link href="/gallerie" className="hover:text-gold-500" onClick={() => setIsMobileMenuOpen(false)}>Gallerie</Link>
          <hr className="w-48" style={{ borderColor: 'var(--color-border)' }} />

          {status === 'unauthenticated' && (
            <Link href="/login" className="bg-gold-500 text-black font-semibold px-4 py-2 rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
              Login
            </Link>
          )}
          {status === 'authenticated' && (
            <>
              <Link href="/meine-termine" className="hover:bg-gold-500 hover:text-black" onClick={() => setIsMobileMenuOpen(false)}>Meine Termine</Link>
              <Link href="/einstellungen" className="hover:bg-gold-500 hover:text-black" onClick={() => setIsMobileMenuOpen(false)}>Einstellungen</Link>

              {(session.user?.role === 'BARBER' || session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                <Link href="/admin/kalender" className="hover:bg-gold-500 hover:text-black">Terminkalender</Link>
              )}
              {(session.user?.role === 'ADMIN' || session.user?.role === 'HEADOFBARBER') && (
                <Link href="/admin/friseure" className="hover:bg-gold-500 hover:text-black">Mitarbeiter bearbeiten</Link>
              )}

              <button onClick={() => { signOut({ callbackUrl: '/' }); setIsMobileMenuOpen(false); }} className="text-red-400 hover:bg-red-500 hover:text-white">
                Abmelden
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}