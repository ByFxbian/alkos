import Link from 'next/link';
import BarberCard from '@/components/BarberCard';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma';
import TikTokCarousel from '@/components/TikTokCarousel';

export default async function Home() {
  const barbers = await prisma.user.findMany({
    where: { role: Role.FRISEUR },
    take: 3,
  });

  return (
    <main>
      <section className="min-h-screen flex items-center justify-center -mt-16">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Willkommen bei Alkos Barber
          </h1>
          <p className="mt-4 text-lg md:text-xl text-neutral-300 max-w-2xl mx-auto">
            Hier kommt irgendein Text rein aber ich weiß noch nicht was
          </p>
          <div className="mt-8">
            <Link
            href="/termine"
            className="bg-amber-400 text-black font-bold text-lg px-8 py-3 rounded-full hover:bg-amber-300 transition-transform duration-300 ease-in-out inline-block transform hover:scale-105">
              Jetzt Termin buchen
            </Link>
          </div>
        </div>
      </section>

      <section id='team' className='py-20 bg-black'>
        <div className='container mx-auto px-4'>
          <h2 className='text-4xl font-bold text-center mb-12'>
            Lerne unser Team kennen
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center'>
            {barbers.map((barber) => (
              <BarberCard
                key={barber.id}
                name={barber.name || 'Barber'}
                role={barber.role}
                imageUrl={'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="tiktok" className="py-20 bg-neutral-950">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12">
            Unsere Arbeit in Action
          </h2>
          <TikTokCarousel />
          <div className="text-center mt-12">
            <Link href="/gallerie" className="text-amber-400 font-semibold hover:underline">
              Klicke hier um mehr zu sehen &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}