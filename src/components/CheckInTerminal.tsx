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
    const [actionType, setActionType] = useState<'check-in' | 'check-out'>('check-in');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Track today's check-in status map for barber list badges
    const [todayStatusMap, setTodayStatusMap] = useState<Record<string, { checkInAt?: string; checkOutAt?: string; isAuto?: boolean }>>({});

    const [resultMessage, setResultMessage] = useState<{
        type: 'success' | 'warning' | 'error';
        text: string;
        barberName?: string;
        barberImage?: string | null;
        checkInAt?: string;
        checkOutAt?: string;
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

    const fetchTodayStatus = async () => {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const res = await fetch(`/api/admin/check-in?startDate=${todayStr}&endDate=${todayStr}&locationId=${selectedLocationId}`);
            if (res.ok) {
                const data = await res.json();
                const map: Record<string, { checkInAt?: string; checkOutAt?: string; isAuto?: boolean }> = {};
                (data.checkIns || []).forEach((c: any) => {
                    map[c.barberId] = {
                        checkInAt: c.checkInAt,
                        checkOutAt: c.checkOutAt,
                        isAuto: c.isAutoCheckOut,
                    };
                });
                setTodayStatusMap(map);
            }
        } catch (e) {
            console.error('Error fetching today status:', e);
        }
    };

    useEffect(() => {
        fetchTodayStatus();
    }, [selectedLocationId]);

    const handlePinDigit = (digit: string) => {
        if (pin.length < 6) {
            setPin(prev => prev + digit);
        }
    };

    const handlePinDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleCheckInOut = async (overrideAction?: 'check-in' | 'check-out') => {
        if (!pin || pin.length < 4) return;

        const targetAction = overrideAction || actionType;

        setIsSubmitting(true);
        setResultMessage(null);

        try {
            const res = await fetch('/api/admin/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pin,
                    locationId: selectedLocationId,
                    action: targetAction,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setResultMessage({
                    type: 'error',
                    text: data.error || 'Fehler beim Stempeln.',
                });
            } else if (data.alreadyCheckedIn && data.canCheckOut && targetAction !== 'check-out') {
                // Was already checked in, prompt user to check out
                setActionType('check-out');
                setResultMessage({
                    type: 'warning',
                    text: `${data.message} Möchtest du dich jetzt auschecken?`,
                    barberName: data.barberName,
                    barberImage: data.barberImage,
                    checkInAt: data.checkInAt,
                });
            } else if (data.alreadyCheckedOut) {
                setResultMessage({
                    type: 'warning',
                    text: data.message,
                    barberName: data.barberName,
                    barberImage: data.barberImage,
                });
                setPin('');
                setSelectedBarber(null);
                setActionType('check-in');
            } else {
                setResultMessage({
                    type: data.status === 'LATE' ? 'warning' : 'success',
                    text: data.message,
                    barberName: data.barberName,
                    barberImage: data.barberImage,
                    checkInAt: data.checkInAt,
                    checkOutAt: data.checkOutAt,
                });
                setPin('');
                setSelectedBarber(null);
                setActionType('check-in');
                fetchTodayStatus();
            }
        } catch (error) {
            console.error('Check-in/out error:', error);
            setResultMessage({
                type: 'error',
                text: 'Netzwerkfehler. Bitte versuche es erneut.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Header with Digital Clock */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                <div>
                    <span className="inline-block px-3 py-1 bg-gold-500/10 text-gold-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full mb-1 sm:mb-2">
                        Salon Stempeluhr
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[var(--color-text)]">
                        Arbeitszeit Stempeluhr
                    </h2>
                    <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 sm:mt-1">
                        Einchecken bei Ankunft & Auschecken bei Feierabend.
                    </p>
                </div>

                <div className="w-full sm:w-auto flex flex-row items-center justify-between sm:justify-end gap-3 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
                    {locations.length > 1 && (
                        <div className="text-left">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block mb-0.5">Standort</label>
                            <select
                                value={selectedLocationId}
                                onChange={e => setSelectedLocationId(e.target.value)}
                                className="bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-2.5 py-1.5 text-xs sm:text-sm font-bold text-[var(--color-text)] outline-none focus:border-gold-500"
                            >
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="bg-neutral-900 border border-neutral-800 text-gold-500 px-4 sm:px-5 py-2 sm:py-3 rounded-xl text-center shadow-inner min-w-[120px] sm:min-w-[140px]">
                        <span className="text-[9px] sm:text-xs font-bold text-neutral-400 uppercase tracking-widest block">Uhrzeit</span>
                        <span className="font-mono text-xl sm:text-2xl font-black tracking-widest">{currentTime || '00:00:00'}</span>
                    </div>
                </div>
            </div>

            {/* Notification Banner */}
            <AnimatePresence>
                {resultMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`p-4 sm:p-6 rounded-2xl border shadow-xl flex items-center gap-3 sm:gap-4 ${
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
                                width={48}
                                height={48}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-gold-500 shrink-0"
                            />
                        ) : (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gold-500 text-black flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                                {resultMessage.barberName ? resultMessage.barberName.charAt(0) : '✓'}
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            {resultMessage.barberName && (
                                <p className="font-bold text-base sm:text-lg text-white truncate">{resultMessage.barberName}</p>
                            )}
                            <p className="text-xs sm:text-sm font-medium leading-tight">{resultMessage.text}</p>
                        </div>

                        {resultMessage.type === 'warning' && pin.length >= 4 && actionType === 'check-out' ? (
                            <button
                                onClick={() => handleCheckInOut('check-out')}
                                className="text-xs font-bold uppercase tracking-wider px-3 py-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition-colors shrink-0"
                            >
                                Jetzt Auschecken
                            </button>
                        ) : (
                            <button
                                onClick={() => setResultMessage(null)}
                                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-current hover:bg-white/10 transition-colors shrink-0"
                            >
                                Schließen
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Check-In/Out Grid & Keypad */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
                {/* Left: Barbers list with today's status badges */}
                <div className="lg:col-span-7 space-y-3 sm:space-y-4">
                    <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center justify-between">
                        <span>Mitarbeiter auswählen</span>
                        <span className="text-[9px] font-normal normal-case opacity-75">Status heute</span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {barbers.map(barber => {
                            const isSelected = selectedBarber?.id === barber.id;
                            const status = todayStatusMap[barber.id];
                            const isCheckedIn = status?.checkInAt && !status?.checkOutAt;
                            const isCheckedOut = !!status?.checkOutAt;

                            return (
                                <button
                                    key={barber.id}
                                    onClick={() => {
                                        setSelectedBarber(barber);
                                        setPin('');
                                        setResultMessage(null);
                                        if (isCheckedIn) {
                                            setActionType('check-out');
                                        } else {
                                            setActionType('check-in');
                                        }
                                    }}
                                    className={`p-3 sm:p-4 rounded-xl border flex flex-col items-center gap-2 sm:gap-2.5 text-center transition-all relative ${
                                        isSelected
                                            ? 'bg-gold-500 text-black border-gold-500 scale-105 shadow-xl font-bold'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:border-gold-500/50'
                                    }`}
                                >
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-gold-500/40 relative shrink-0">
                                        {barber.image ? (
                                            <Image
                                                src={barber.image}
                                                alt={barber.name || 'Barber'}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-[var(--color-surface-2)] flex items-center justify-center font-bold text-lg sm:text-xl">
                                                {barber.name ? barber.name.charAt(0) : 'B'}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs sm:text-sm font-semibold truncate w-full">{barber.name || 'Unbekannt'}</span>
                                    
                                    {/* Status Badge */}
                                    {isCheckedIn && (
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isSelected ? 'bg-black text-gold-500' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                            🟢 Eingecheckt
                                        </span>
                                    )}
                                    {isCheckedOut && (
                                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isSelected ? 'bg-black text-white' : 'bg-neutral-500/20 text-neutral-400 border border-neutral-500/30'}`}>
                                            {status.isAuto ? '⚠️ Auto-Out' : '🔴 Ausgecheckt'}
                                        </span>
                                    )}
                                    {!isCheckedIn && !isCheckedOut && (
                                        <span className={`text-[9px] font-normal px-2 py-0.5 opacity-60`}>
                                            ⚪ Nicht da
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right: Keypad / PIN Entry */}
                <div className="lg:col-span-5 bg-[var(--color-surface)] border border-[var(--color-border)] p-4 sm:p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center space-y-4 sm:space-y-5 w-full">
                    <div className="text-center w-full">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">
                            PIN-Eingabe
                        </span>
                        <p className="text-xs sm:text-sm font-bold text-[var(--color-text)] mt-0.5 truncate max-w-[260px] mx-auto">
                            {selectedBarber ? selectedBarber.name : 'Wähle deinen Namen oder tippe den PIN'}
                        </p>

                        {/* Action Selector: Einchecken / Auschecken */}
                        <div className="flex bg-[var(--color-surface-2)] p-1 rounded-xl border border-[var(--color-border)] mt-3 max-w-[260px] mx-auto">
                            <button
                                type="button"
                                onClick={() => setActionType('check-in')}
                                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                                    actionType === 'check-in'
                                        ? 'bg-gold-500 text-black shadow-md'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                }`}
                            >
                                📥 Einchecken
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionType('check-out')}
                                className={`flex-1 py-1.5 text-xs font-extrabold rounded-lg transition-all ${
                                    actionType === 'check-out'
                                        ? 'bg-gold-500 text-black shadow-md'
                                        : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                }`}
                            >
                                📤 Auschecken
                            </button>
                        </div>
                    </div>

                    {/* PIN Dots Display */}
                    <div className="flex gap-2.5 sm:gap-3 justify-center items-center h-8 sm:h-10">
                        {[0, 1, 2, 3, 4, 5].map(idx => (
                            <div
                                key={idx}
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border transition-all ${
                                    idx < pin.length
                                        ? 'bg-gold-500 border-gold-500 scale-110 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                        : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
                                }`}
                            />
                        ))}
                    </div>

                    {/* Keypad Grid */}
                    <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[280px]">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(btn => (
                            <button
                                key={btn}
                                type="button"
                                onClick={() => {
                                    if (btn === 'C') setPin('');
                                    else if (btn === '⌫') handlePinDelete();
                                    else handlePinDigit(btn);
                                }}
                                className={`h-12 sm:h-14 rounded-xl text-base sm:text-lg font-bold transition-all active:scale-95 shadow-sm ${
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
                        onClick={() => handleCheckInOut()}
                        disabled={pin.length < 4 || isSubmitting}
                        className={`w-full max-w-[280px] py-3.5 sm:py-4 text-black font-extrabold rounded-xl transition-all shadow-lg hover:shadow-gold-500/20 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider text-xs sm:text-sm flex items-center justify-center gap-2 ${
                            actionType === 'check-out'
                                ? 'bg-amber-500 hover:bg-amber-400'
                                : 'bg-gold-500 hover:bg-gold-400'
                        }`}
                    >
                        {isSubmitting
                            ? 'Prüfe...'
                            : actionType === 'check-out'
                            ? '📤 Jetzt Auschecken'
                            : '📥 Jetzt Einchecken'}
                    </button>
                </div>
            </div>
        </div>
    );
}
