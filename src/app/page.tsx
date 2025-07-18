import Link from 'next/link';
import BarberCard from '@/components/BarberCard';

const teamMembers = [
  {
    name: 'Alen',
    role: 'Barber',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png', // Beispielbild
  },
  {
    name: 'Max',
    role: 'Lehrling',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png', // Beispielbild
  },
  {
    name: 'Felix',
    role: 'Lehrling',
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png', // Beispielbild
  },
];


export default function Home() {
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
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {teamMembers.map((member) => (
              <BarberCard
                key={member.name}
                name={member.name}
                role={member.role}
                imageUrl={member.imageUrl}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}