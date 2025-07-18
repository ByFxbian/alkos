'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <header className="bg-neutral-950/50 backdrop-blur-sm sticky top-0 z-50 border-b border-white/10">
      <nav className="container mx-auto flex items-center justify-between p-4 text-white">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-white hover:text-amber-400 transition-colors">
          Alkos
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/termine" className="hover:text-amber-400 transition-colors">Termine</Link>
          <Link href="/team" className="hover:text-amber-400 transition-colors">Team</Link>
           <Link href="/gallerie" className="hover:text-amber-400 transition-colors">Gallerie</Link>
        </div>

        <div className="w-28 text-right">
          {status === 'loading' && (
            <div className="h-9 w-9 bg-neutral-700 rounded-full animate-pulse"></div>
          )}

          {status === 'unauthenticated' && (
             <Link href="/login" className="bg-white text-black font-semibold px-4 py-2 rounded-md hover:bg-amber-400 transition-colors">
              Login
            </Link>
          )}

          {status === 'authenticated' && (
            <div className="relative" ref={dropdownRef}>
               <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="bg-amber-500 text-black w-9 h-9 rounded-full flex items-center justify-center font-bold">
                {session.user?.name?.charAt(0).toUpperCase()}
               </button>
               
               {/* Dropdown-Menü */}
               <div className={`absolute right-0 mt-2 w-56 bg-neutral-800 rounded-md shadow-lg py-1 transition-all duration-300 ${isDropdownOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                 <p className="px-4 py-2 text-sm text-neutral-400 truncate">Hallo, {session.user?.name}</p>
                 <hr className="border-neutral-700" />

                 <Link href="/meine-termine" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Meine Termine</Link>
                 <Link href="/einstellungen" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Einstellungen</Link>

                 {/* Barber & Admin Links */}
                 {(session.user?.role === 'FRISEUR' || session.user?.role === 'ADMIN') && (
                    <Link href="/admin/kalender" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Terminkalender bearb.</Link>
                 )}
                 {session.user?.role === 'ADMIN' && (
                    <Link href="/admin/friseure" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Friseure bearbeiten</Link>
                 )}
                 
                 <hr className="border-neutral-700 my-1" />
                 <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-neutral-700">
                    Abmelden
                 </button>
               </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}