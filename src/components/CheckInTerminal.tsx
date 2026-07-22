'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Barber {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
}

interface Location {
    id: string;
    name: string;
    city: string;
}

interface CheckInTerminalProps {
    barbers: Barber[];
    locations: Location[];
    defaultLocationId?: string;
}

export default function CheckInTerminal({ barbers, locations, defaultLocationId }: CheckInTerminalProps) {
    const [selectedLocationId, setSelectedLocationId] = useState(defaultLocationId || (locations[0]?.id || ''));
    const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMessage, setResultMessage] = useState<{
        type: 'success' | 'warning' | 'error';
        text: string;
        barberName?: string;
        barberImage?: string | null;
        checkInAt?: string;
    } | null>(null);

    const [currentTime, setCurrentTime] = useState<string>('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateClock();
        const timer = setInterval(updateClock, 1000);
        return () => clearInterval(timer);
    }, []);

    const handlePinDigit = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
        }
    };

    const handlePinDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleCheckIn = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!pin || pin.length < 4) return;

        setIsSubmitting(true);
        setResultMessage(null);

        try {
            const res = await fetch('/api/admin/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    locationId: selectedLocationId,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setResultMessage({
                    type: 'error',
                    text: data.error || 'Fehler beim Check-in.',
                });
            } else if (data.alreadyCheckedIn) {
                setResultMessage({
                    type: 'warning',
                    text: data.message,
                    barberName: data.barberName,
                    barberImage: data.barberImage,
                    checkInAt: data.checkInAt,
                });
                setPin('');
                setSelectedBarber(null);
            } else {
                setResultMessage({
                    type: data.status === 'LATE' ? 'warning' : 'success',
                    text: data.message,
                    barberName: data.barberName,
                    barberImage: data.barberImage,
                    checkInAt: data.checkInAt,
                });
                setPin('');
                setSelectedBarber(null);
            }
        } catch (error) {
            console.error('Check-in error:', error);
            setResultMessage({
                type: 'error',
                text: 'Netzwerkfehler. Bitte versuche es erneut.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <span className="inline-block px-3 py-1 bg-gold-500/10 text-gold-500 text-xs font-bold uppercase tracking-wider rounded-full mb-2">
                        Salon Stempeluhr
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-[var(--color-text)]">
                        Morgen Check-in
                    </h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Bitte wähle deinen Namen oder gib deinen PIN ein, um dich pünktlich anzumelden.
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    {locations.length > 1 && (
                        <div className="text-left">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block mb-1">Standort</label>
                            <select
                                value={selectedLocationId}
                                onChange={e => setSelectedLocationId(e.target.value)}
                                className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-bold text-[var(--color-text)] outline-none focus:border-gold-500"
                            >
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="bg-neutral-900 border border-neutral-800 text-gold-500 px-5 py-3 rounded-xl text-center shadow-inner min-w-[140px]">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Uhrzeit</span>
                        <span className="font-mono text-2xl font-black tracking-widest">{currentTime || '00:00:00'}</span>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {resultMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-6 rounded-2xl border shadow-xl flex items-center gap-4 ${
                            resultMessage.type === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : resultMessage.type === 'warning'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                    >
                        {resultMessage.barberImage ? (
                            <Image
                                src={resultMessage.barberImage}
                                alt={resultMessage.barberName || 'User'}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gold-500"
                            />
                        ) : (
                            <div className="w-14 h-14 rounded-full bg-gold-500 text-black flex items-center justify-center font-bold text-xl">
                                {resultMessage.barberName ? resultMessage.barberName.charAt(0) : '✓'}
                            </div>
                        )}

                        <div className="flex-1">
                            {resultMessage.barberName && (
                                <p className="font-bold text-lg text-white">{resultMessage.barberName}</p>
                            )}
                            <p className="text-sm font-medium">{resultMessage.text}</p>
                        </div>

                        <button
                            onClick={() => setResultMessage(null)}
                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border border-current hover:bg-white/10 transition-colors"
                        >
                            Schließen
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                        Mitarbeiter auswählen
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {barbers.map(barber => {
                            const isSelected = selectedBarber?.id === barber.id;
                            return (
                                <button
                                    key={barber.id}
                                    onClick={() => {
                                        setSelectedBarber(barber);
                                        setPin('');
                                        setResultMessage(null);
                                    }}
                                    className={`p-4 rounded-xl border flex flex-col items-center gap-3 text-center transition-all ${
                                        isSelected
                                            ? 'bg-gold-500 text-black border-gold-500 scale-105 shadow-xl font-bold'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-gold-500/50'
                                    }`}
                                >
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gold-500/40 relative">
                                        {barber.image ? (
                                            <Image
                                                src={barber.image}
                                                alt={barber.name || 'Barber'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[var(--color-surface-2)] flex items-center justify-center font-bold text-xl">
                                                {barber.name ? barber.name.charAt(0) : 'B'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-semibold truncate w-full">{barber.name || 'Unbekannt'}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-5 bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-6">
                    <div className="text-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">
                            PIN-Eingabe
                        </span>
                        <p className="text-sm font-bold text-[var(--color-text)] mt-1">
                            {selectedBarber ? selectedBarber.name : 'Wähle deinen Namen oder tippe den PIN'}
                        </p>
                    </div>

                    <div className="flex gap-3 justify-center items-center h-10">
                        {[0, 1, 2, 3, 4, 5].map(idx => (
                            <div
                                key={idx}
                                className={`w-4 h-4 rounded-full border transition-all ${
                                    idx < pin.length
                                        ? 'bg-gold-500 border-gold-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                                }`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                            <button
                                key={btn}
                                type="button"
                                onClick={() => {
                                    if (btn === 'C') setPin('');
                                    else if (btn === '⌫') handlePinDelete();
                                    else handlePinDigit(btn);
                                }}
                                className={`h-14 rounded-xl text-lg font-bold transition-all active:scale-95 shadow-sm ${
                                    btn === 'C'
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                        : btn === '⌫'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                                        : 'bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text)] hover:border-gold-500 hover:text-gold-500'
                                }`}
                            >
                                {btn}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handleCheckIn()}
                        disabled={pin.length < 4 || isSubmitting}
                        className="w-full max-w-[260px] py-4 bg-gold-500 text-black font-extrabold rounded-xl hover:bg-gold-400 transition-all shadow-lg hover:shadow-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-sm flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? 'Prüfe PIN...' : 'Jetzt Einchecken'}
                    </button>
                </div>
            </div>
        </div>
    );
}
