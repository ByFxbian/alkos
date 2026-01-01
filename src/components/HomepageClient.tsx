/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import BarberCard from '@/components/BarberCard';
import { useState, useEffect } from 'react';
import type { User } from '@/generated/prisma';
import { motion, type Variants } from 'framer-motion';
import TikTokCarousel from '@/components/TikTokCarousel';
import LocationMap from './LocationMap';

type HomepageClientProps = {
    location: any;
    teamMembers: any[];
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
]

const salonImages = [
  { id: 1, src: '/images/gallery-1.jpeg', alt: 'Waschbereich' },
  { id: 2, src: '/images/gallery-2.jpeg', alt: 'Schneidebereich Neon Sign' },
  { id: 3, src: '/images/gallery-3.jpeg', alt: 'Schneidebereich 2' },
  { id: 4, src: '/images/gallery-6.jpeg', alt: 'Design Dekoration Eingangsbereich' },
  { id: 5, src: '/images/gallery-5.jpeg', alt: 'ALKOS beim Schnitt' },
  { id: 6, src: '/images/gallery-4.jpeg', alt: 'Wartebereich Fernseher' },
];

const containerVariants:Variants = {
    hidden: { opacity: 0},
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2,
            delayChildren: 0.3
        }
    }
};

const itemVariants:Variants = {
    hidden: { y: 30, opacity: 0},
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 50 }
    }
};

export default function HomepageClient({ location, teamMembers }: HomepageClientProps) {
    const [opacity, setOpacity] = useState(1);

    const galleryImages = location.galleryImages && location.galleryImages.length > 0 
        ? location.galleryImages.map((src: string, i: number) => ({ src, alt: `Atmosphere ${i+1}` })) 
        : salonImages;

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
                    src={location.heroImage || "/images/hero-bg.jpeg"}
                    alt={`Hintergrund ${location.name}`}
                    fill
                    style={{ objectFit: 'cover' }}
                    quality={90}
                    priority
                    className="blur-xs"
                    />
                </div>
                <section className='min-h-screen flex items-center justify-center -mt-16 rounded-xl overflow-hidden'>
                    <motion.div 
                        className="container mx-auto text-center px-4 relative z-10"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <motion.h1 
                            className="text-6xl md:text-8xl font-extrabold tracking-tighter text-white drop-shadow-2xl shadow-black mb-2"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            {location.name}
                        </motion.h1>
                        <motion.p 
                            className="text-xl md:text-2xl max-w-2xl mx-auto text-neutral-200 font-medium drop-shadow-lg shadow-black"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            Dein Go-To Barbershop in {location.city}.
                        </motion.p>
                        
                        <motion.div 
                            className="mt-10"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link
                            href={`/${location.slug}/termine`}
                            className="bg-gold-500 text-black font-bold text-lg px-10 py-4 rounded-full hover:bg-gold-400 transition-colors shadow-xl inline-block">
                            Jetzt Termin buchen
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                <section id='atomosphere' className='py-24' style={{ backgroundColor: 'var(--color-surface-2)'}}>
                    <div className='container mx-auto px-4'>
                        <motion.div 
                            className="text-center mb-16"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                        >
                            <h2 className='text-4xl md:text-5xl font-bold text-center mb-4'>
                                Unsere Atmosphäre
                            </h2>
                            <p className='text-center mb-12 max-w-2xl mx-auto' style={{ color: 'var(--color-text-muted)'}}>
                                Mehr als nur ein Cut. Entspann dich in unserem Loungebereich oder zock eine Runde an unserer Playstation. 
                            </p>
                        </motion.div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {galleryImages.slice(0, 6).map((img: any, index: number) => (
                               <motion.div 
                                    key={index} 
                                    className={`relative h-48 md:h-72 rounded-2xl overflow-hidden group shadow-lg border border-white/5 cursor-pointer`}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <Image
                                        src={img.src}
                                        alt={img.alt}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                                </motion.div>
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
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className='text-4xl md:text-5xl font-bold text-center mb-16'
                        >
                            Die Crew ({location.city})
                        </motion.h2>
                        <motion.div 
                            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-center'
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                        >
                            {teamMembers.length > 0 ? (
                                teamMembers.map((member) => (
                                <motion.div key={member.id} variants={itemVariants}>
                                    <BarberCard
                                        name={member.name}
                                        role={member.role}
                                        image={member.imageUrl}
                                        bio={member.bio || ''}
                                    />
                                </motion.div>
                            ))
                            ) : (
                                <p className="text-center col-span-full text-neutral-500">
                                    Noch keine Teammitglieder für diesen Standort eingetragen.
                                </p>
                            )}
                        </motion.div>
                    </div>
                </section>

                <section className="py-24 bg-neutral-950">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-4xl font-bold mb-6">Hier findest du uns</h2>
                                <p className="text-lg text-neutral-400 mb-8">
                                    Zentral in {location.city}. Perfekt erreichbar, entspannte Parkplatzsituation und direkt im Geschehen.
                                </p>
                                <div className="space-y-4 text-neutral-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500">
                                            📍
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">Adresse</p>
                                            <p>{location.address}, {location.postalCode} {location.city}</p>
                                        </div>
                                    </div>
                                    {location.slug === 'wien' && (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500">
                                                🚃
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">Öffis</p>
                                                <p>Hauptbahnhof / Südtiroler Platz (U1, S-Bahn)</p>
                                            </div>
                                        </div>  
                                    )}               
                                </div>
                            </div>
                            <LocationMap 
                                googleMapsUrl={location.googleMapsUrl} 
                                address={location.address} 
                                city={location.city} 
                                postalCode={location.postalCode}
                            />
                        </div>
                    </div>
                </section>
            </main>
    );
}