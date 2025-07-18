'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session, status } = useSession();

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
          <Link href="/preise" className="hover:text-amber-400 transition-colors">Preise</Link>
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
            <div className="relative group">
               <span className="cursor-pointer bg-amber-500 text-black w-9 h-9 rounded-full flex items-center justify-center font-bold">
                {session.user?.name?.charAt(0).toUpperCase()}
               </span>
               <div className="absolute right-0 mt-2 w-48 bg-neutral-800 rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                 <p className="px-4 py-2 text-sm text-neutral-400 truncate">Hallo, {session.user?.name}</p>
                 <Link href="/meine-termine" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Meine Termine</Link>
                 {session.user?.role === 'FRISEUR' && (
                    <Link href="/admin/kalender" className="block px-4 py-2 text-sm text-white hover:bg-neutral-700">Mein Kalender</Link>
                 )}
                 <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full text-left block px-4 py-2 text-sm text-red-400 hover:bg-neutral-700">
                    Logout
                 </button>
               </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}