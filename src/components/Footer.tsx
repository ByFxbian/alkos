import Link from "next/link";
import { FaInstagram, FaTiktok } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="border-t mt-20" style={{
        backgroundColor: 'var(--color-surface-3)',
        borderColor: 'var(--color-border)'
      }}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-bold text-lg text-gold-500">Alkos Barber</h3>
            <p className=" mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Präzision in jedem Schnitt
            </p>
          </div>
          <div>
            <h3 className="font-bold text-lg">Navigation</h3>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link href="/termine" className=" hover:text-gold-500" style={{ color: 'var(--color-text-muted)' }}>Termine</Link></li>
              <li><Link href="/team" className=" hover:text-gold-500" style={{ color: 'var(--color-text-muted)' }}>Team</Link></li>
              <li><Link href="/gallerie" className=" hover:text-gold-500" style={{ color: 'var(--color-text-muted)' }}>Gallerie</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg">Kontakt</h3>
            <div className="mt-2 space-y-1 text-sm " style={{ color: 'var(--color-text-muted)' }}>
              <p>Wiedner Gürtel 12, 1040 Wien</p>
              <div className="mt-2 flex justify-center md:justify-start">
                <a href="https://www.instagram.com/alkosbarbershop" target="_blank" rel="noopener noreferrer" className=" hover:text-gold-500">
                    <FaInstagram size={24} />
                </a>
                <a href="https://www.tiktok.com/@daddy_alko" target="_blank" rel="noopener noreferrer" className="px-4  hover:text-gold-500">
                    <FaTiktok size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t  mt-8 pt-4 text-center text-xs " style={{ 
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-muted)' 
          }}>
          <p>&copy; {new Date().getFullYear()} ALKOS. Alle Rechte vorbehalten.</p>
          <p className="mt-1">
            <Link href="/impressum" className="hover:underline">Impressum</Link> | <Link href="/datenschutz" className="hover:underline">Datenschutz</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}