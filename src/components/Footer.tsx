import Link from "next/link";
import { FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          {/* Spalte 1: Über Uns */}
          <div>
            <h3 className="font-bold text-lg text-gold-500">Alkos Barber</h3>
            <p className="text-neutral-400 mt-2 text-sm">
              Präzision in jedem Schnitt
            </p>
          </div>
          {/* Spalte 2: Links */}
          <div>
            <h3 className="font-bold text-lg">Navigation</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/termine" className="text-neutral-300 hover:text-gold-500">Termine</Link></li>
              <li><Link href="/team" className="text-neutral-300 hover:text-gold-500">Team</Link></li>
              <li><Link href="/gallerie" className="text-neutral-300 hover:text-gold-500">Gallerie</Link></li>
            </ul>
          </div>
          {/* Spalte 3: Kontakt */}
          <div>
            <h3 className="font-bold text-lg">Kontakt</h3>
            <div className="mt-2 space-y-1 text-sm text-neutral-300">
              <p>Simmeringer Hauptstraße 11, 1110 Wien</p>
              {/* Hier fügen wir später die Social Media Icons ein */}
              <div className="mt-2 flex justify-center md:justify-start">
                <a href="https://www.instagram.com/alkosbarbershop" target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-gold-500">
                    <FaInstagram size={24} />
                </a>
                <a href="https://www.tiktok.com/@daddy_alko" target="_blank" rel="noopener noreferrer" className="px-4 text-neutral-300 hover:text-gold-500">
                    <FaTiktok size={24} />
                </a>
                {/* Hier könntest du weitere Icons hinzufügen, z.B. FaFacebook */}
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800 mt-8 pt-4 text-center text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} Alkos Barber. Alle Rechte vorbehalten.</p>
          <p className="mt-1">
            <Link href="/impressum" className="hover:underline">Impressum</Link> | <Link href="/datenschutz" className="hover:underline">Datenschutz</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}