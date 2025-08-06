'use client';

import Link from 'next/link';
import Image from 'next/image';
import BarberCard from '@/components/BarberCard';
import { useState, useEffect } from 'react';
import type { User } from '@/generated/prisma';
import TikTokCarousel from '@/components/TikTokCarousel';

type HomepageClientProps = {
  barbers: User[];
};

export default function HomepageClient({ barbers }: HomepageClientProps) {
    const [opacity, setOpacity] = useState(1);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const fadeOutDistance = 500;
            const newOpacity = Math.max(0, 1 - scrollY / fadeOutDistance);
            setOpacity(newOpacity)
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
  
    return (
        <>
            <div className="fixed top-0 left-0 w-full h-screen -z-10" style={{ opacity }}>
                <Image
                src="/barber-bg.png"
                alt="Hintergrund eines Barbershops"
                fill
                style={{ objectFit: 'cover' }}
                quality={90}
                priority
                />
                {/* Ein leichter schwarzer Schleier über dem Bild für bessere Lesbarkeit */}
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            <main>
                <section className="min-h-screen flex items-center justify-center -mt-16 bg-black/20 rounded-xl border border-white/10"> {/* backdrop-blur-sm */}
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
                            className="bg-gold-500 text-black font-bold text-lg px-8 py-3 rounded-full hover:bg-gold-400 transition-transform duration-300 ease-in-out inline-block transform hover:scale-105">
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
                            <Link href="/gallerie" className="text-gold-500 font-semibold hover:underline">
                            Klicke hier um mehr zu sehen &rarr;
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}