'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import Image from 'next/image';

type CustomerData = {
    name: string | null;
    email: string;
    image: string | null;
    instagram: string | null;
    completedAppointments: number;
}

interface CustomerDetailsModalProps {
    customer: CustomerData | null;
    onClose: () => void;
}

export default function CustomerDetailsModal({customer, onClose}: CustomerDetailsModalProps) {
    const [showFullImage, setShowFullImage] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const imageRef = useRef<HTMLDivElement>(null);

    const dragY = useMotionValue(0);
    const backdropOpacity = useTransform(dragY, [-200, 0, 200], [0.3, 1, 0.3]);
    const imageScale = useTransform(dragY, [-200, 0, 200], [0.7, 1, 0.7]);

    useEffect(() => {
        setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    const handleTouchStart = useCallback(() => {
        if (!customer?.image) return;
        longPressTimer.current = setTimeout(() => {
            setShowFullImage(true);
        }, 300);
    }, [customer?.image]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const handleDesktopClick = useCallback(() => {
        if (!customer?.image || isMobile) return;
        setShowFullImage(true);
    }, [customer?.image, isMobile]);

    const handleDragEnd = useCallback((_: never, info: { offset: { y: number } }) => {
        if (Math.abs(info.offset.y) > 100) {
            setShowFullImage(false);
        }
        dragY.set(0);
    }, [dragY]);

    if(!customer) return null;

    const initials = customer.name
        ? customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
                <div className="p-6 rounded-lg max-w-sm w-full border"
                    style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)'}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-xl font-bold mb-4">Kundendetails</h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div
                            ref={imageRef}
                            className="relative flex-shrink-0"
                            onClick={handleDesktopClick}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                            onTouchCancel={handleTouchEnd}
                        >
                            {customer.image ? (
                                <Image
                                    src={customer.image}
                                    alt={customer.name || 'Kunde'}
                                    width={56}
                                    height={56}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-[var(--color-gold-500)] cursor-pointer select-none"
                                    draggable={false}
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold border-2 border-[var(--color-border)]"
                                    style={{ backgroundColor: 'var(--color-surface-3)', color: 'var(--color-text-muted)' }}>
                                    {initials}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold">{customer.name || 'N/A'}</p>
                            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{customer.email}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p>
                            <strong>Instagram:</strong>{' '}
                            {customer.instagram ? (
                                <a
                                    href={`https://instagram.com/${customer.instagram}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gold-500 hover:underline"
                                >
                                    @{customer.instagram}
                                </a>
                            ) : (
                                'N/A'
                            )}
                        </p>
                        <p>
                            <strong>Stempel:</strong> {customer.completedAppointments} / 15
                        </p>
                    </div>
                    <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-sm font-semibold"
                        style={{ backgroundColor: 'var(--color-surface-3)'}}
                    >
                        Schließen
                    </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showFullImage && customer.image && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            className="absolute inset-0"
                            style={{
                                opacity: isMobile ? backdropOpacity : 1,
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                                backgroundColor: 'rgba(0,0,0,0.75)',
                            }}
                            onClick={() => setShowFullImage(false)}
                        />

                        {!isMobile && (
                            <button
                                onClick={() => setShowFullImage(false)}
                                className="absolute top-4 right-4 z-[110] w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center text-xl hover:bg-black/80 transition-colors"
                            >
                                ✕
                            </button>
                        )}

                        {isMobile ? (
                            <motion.div
                                className="relative z-[105] touch-none select-none"
                                drag
                                dragElastic={0.5}
                                dragConstraints={{ left: -100, right: 100, top: -200, bottom: 200 }}
                                onDragEnd={handleDragEnd}
                                style={{
                                    y: dragY,
                                    scale: imageScale,
                                }}
                                initial={{ scale: 0.3, opacity: 0, borderRadius: '50%' }}
                                animate={{ scale: 1, opacity: 1, borderRadius: '50%' }}
                                exit={{ scale: 0.3, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            >
                                <Image
                                    src={customer.image}
                                    alt={customer.name || 'Kunde'}
                                    width={320}
                                    height={320}
                                    className="w-72 h-72 sm:w-80 sm:h-80 rounded-full object-cover pointer-events-none"
                                    style={{
                                        boxShadow: '0 0 60px rgba(0,0,0,0.5)',
                                        border: '3px solid rgba(255,255,255,0.15)',
                                    }}
                                    draggable={false}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                className="relative z-[105] rounded-2xl overflow-hidden cursor-pointer"
                                style={{
                                    maxWidth: '80vw',
                                    maxHeight: '75vh',
                                    boxShadow: '0 0 80px rgba(0,0,0,0.6)',
                                }}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                onClick={() => setShowFullImage(false)}
                            >
                                <Image
                                    src={customer.image}
                                    alt={customer.name || 'Kunde'}
                                    width={600}
                                    height={600}
                                    className="object-cover"
                                    style={{ maxWidth: '80vw', maxHeight: '75vh' }}
                                    draggable={false}
                                />
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}