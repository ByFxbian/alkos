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

const teamMembers = [
    {
        id: 1,
        name: 'ALKO',
        role: 'Head of Barber',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/ALKOS.png',
        bio: ''
    },
    {
        id: 2,
        name: 'Tina',
        role: 'Managing Partner',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/TINA.png',
        bio: ''
    },
    {
        id: 3,
        name: 'Adam',
        role: 'Barber',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/ADAM.png',
        bio: ''
    },
    {
        id: 4,
        name: 'Simon',
        role: 'Barber',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/SIMON.png',
        bio: ''
    },
    {
        id: 5,
        name: 'Antonio',
        role: 'Social Media Content Producer',
        imageUrl: 'https://srtkhlfsd31dcfzp.public.blob.vercel-storage.com/ANTONIO.png',
        bio: ''
    }
]

const salonImages = [
  { id: 1, src: '/images/gallery-1.jpeg', alt: 'Waschbereich' },
  { id: 2, src: '/images/gallery-2.jpeg', alt: 'Schneidebereich Neon Sign' },
  { id: 3, src: '/images/gallery-3.jpeg', alt: 'Schneidebereich 2' },
  { id: 4, src: '/images/gallery-6.jpeg', alt: 'Design Dekoration Eingangsbereich' },
  { id: 5, src: '/images/gallery-5.jpeg', alt: 'ALKOS beim Schnitt' },
  { id: 6, src: '/images/gallery-4.jpeg', alt: 'Wartebereich Fernseher' },
];

export default function HomepageClient() {
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
            <main>
                <div className="fixed top-0 left-0 w-full h-screen -z-10" style={{ opacity }}>
                    <Image
                    src="/images/hero-bg.jpeg"
                    alt="Hintergrund ALKOS Barbershop"
                    fill
                    style={{ objectFit: 'cover' }}
                    quality={90}
                    priority
                    className="blur-xs"
                    />
                </div>
                <section className="min-h-screen flex items-center justify-center -mt-16 rounded-xl"> {/* backdrop-blur-sm */}
                    <div className="container mx-auto text-center px-4">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                            Willkommen bei ALKOS
                        </h1>
                        <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
                            Dein Go-To Barbershop
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

                <section id='atomosphere' className='py-20' style={{ backgroundColor: 'var(--color-surface-2)'}}>
                    <div className='container mx-auto px-4'>
                        <h2 className='text-4xl font-bold text-center mb-4'>
                            Unsere Atmosphäre
                        </h2>
                        <p className='text-center mb-12 max-w-2xl mx-auto' style={{ color: 'var(--color-text-muted)'}}>
                            Mehr als nur ein Cut. Entspann dich in unserem Loungebereich oder zock eine Runde an unserer Playstation. 
                        </p>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {salonImages.map((img, index) => (
                                <div 
                                    key={index} 
                                    className={`relative h-100 md:h-100 rounded-xl overflow-hidden group shadow-lg transition-all duration-300 hover:shadow-gold-500/20 border border-neutral-800/50`}
                                >
                                    <Image
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <Link href="/gallerie" className="inline-flex items-center text-gold-500 font-bold hover:text-gold-400 transition-colors group">
                                Zur ganzen Gallerie
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </section>

                <section id='team' className='py-20' style={{ backgroundColor: 'var(--color-surface-3)' }}>
                    <div className='container mx-auto px-4'>
                        <h2 className='text-4xl font-bold text-center mb-12'>
                            Lerne unser Team kennen
                        </h2>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center'>
                            {teamMembers.map((barber) => (
                            <BarberCard
                                key={barber.id}
                                name={barber.name}
                                role={barber.role}
                                image={barber.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                            />
                            ))}
                        </div>
                    </div>
                </section>

                {/*<section id="tiktok" className="py-20" style={{ backgroundColor: 'var(--color-surface-3)' }}>
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
                </section>*/}
            </main>
    );
}