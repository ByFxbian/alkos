'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface CheckInRecord {
    id: string;
    barberId: string;
    barberName: string;
    barberImage: string | null;
    barberRole: string;
    locationId: string;
    locationName: string;
    locationCity: string;
    date: string;
    checkInAt: string;
    checkOutAt: string | null;
    isAutoCheckOut: boolean;
    plannedStart: string | null;
    plannedEnd: string | null;
    status: string;
    delayMinutes: number;
    note: string | null;
}

interface Location {
    id: string;
    name: string;
    city: string;
}

interface AdminZeiterfassungProps {
    locations: Location[];
}

export default function AdminZeiterfassung({ locations }: AdminZeiterfassungProps) {
    const [selectedLocationId, setSelectedLocationId] = useState<string>('');
    const [selectedMonth, setSelectedMonth] = useState<string>(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCheckIns = async () => {
        setIsLoading(true);
        try {
            const [year, month] = selectedMonth.split('-');
            const startDate = `${year}-${month}-01`;
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

            let url = `/api/admin/check-in?startDate=${startDate}&endDate=${endDate}`;
            if (selectedLocationId) {
                url += `&locationId=${selectedLocationId}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCheckIns(data.checkIns || []);
            }
        } catch (error) {
            console.error('Error fetching check-ins:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCheckIns();
    }, [selectedLocationId, selectedMonth]);

    // Calculate KPI Stats
    const totalCheckIns = checkIns.length;
    const lateCheckIns = checkIns.filter(c => c.status === 'LATE');
    const autoCheckOuts = checkIns.filter(c => c.isAutoCheckOut);
    const totalDelayMinutes = checkIns.reduce((acc, c) => acc + (c.delayMinutes || 0), 0);
    const onTimeRate = totalCheckIns > 0 ? Math.round(((totalCheckIns - lateCheckIns.length) / totalCheckIns) * 100) : 100;

    const handlePdfExport = () => {
        window.print();
    };

    const formatDuration = (checkInIso: string, checkOutIso: string | null) => {
        if (!checkOutIso) return 'Noch aktiv';
        const start = new Date(checkInIso).getTime();
        const end = new Date(checkOutIso).getTime();
        const diffMins = Math.max(0, Math.round((end - start) / 60000));
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        return `${hours} Std. ${mins} Min.`;
    };

    return (
        <div className="space-y-6 sm:space-y-8">
            {/* Action Header & Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-text)]">Zeiterfassung & Pünktlichkeit</h2>
                    <p className="text-[11px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 sm:mt-1">
                        Übersicht aller Morgen-Check-ins, Auscheck-Zeiten und Verspätungen.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-3">
                    <select
                        value={selectedLocationId}
                        onChange={e => setSelectedLocationId(e.target.value)}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text)] outline-none focus:border-gold-500"
                    >
                        <option value="">Alle Standorte</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>{loc.name} ({loc.city})</option>
                        ))}
                    </select>

                    <input
                        type="month"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text)] outline-none focus:border-gold-500"
                    />

                    <button
                        onClick={handlePdfExport}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gold-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-gold-400 transition-all shadow-md"
                    >
                        📄 PDF Export
                    </button>
                </div>
            </div>

            {/* Print Header (Only visible on PDF print) */}
            <div className="hidden print:block text-center border-b pb-6 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-black">ALKOS BARBERSHOP — ZEITERFASSUNG & PÜNKTLICHKEIT</h1>
                <p className="text-xs text-neutral-600 mt-1">
                    Monat: {selectedMonth} | Standort: {selectedLocationId ? locations.find(l => l.id === selectedLocationId)?.name : 'Alle Standorte'} | Erstellt am: {new Date().toLocaleDateString('de-AT')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3.5 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Gesamt Check-ins</span>
                    <span className="text-2xl sm:text-3xl font-black text-[var(--color-text)] mt-1 block">{totalCheckIns}</span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3.5 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Pünktlich Quote</span>
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">{onTimeRate}%</span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3.5 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Verspätungen</span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">{lateCheckIns.length} <span className="text-xs font-normal">({totalDelayMinutes} Min)</span></span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-3.5 sm:p-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Auto-Auscheck (Vergessen)</span>
                    <span className="text-2xl sm:text-3xl font-black text-red-400 mt-1 block">{autoCheckOuts.length}</span>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
                {isLoading ? (
                    <div className="p-8 sm:p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                        Lade Zeiterfassungsdaten...
                    </div>
                ) : checkIns.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-xs text-[var(--color-text-muted)]">
                        Keine Check-in Protokolle für den ausgewählten Zeitraum gefunden.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">
                                    <th className="p-3.5 sm:p-4">Datum</th>
                                    <th className="p-3.5 sm:p-4">Mitarbeiter</th>
                                    <th className="p-3.5 sm:p-4">Standort</th>
                                    <th className="p-3.5 sm:p-4">Soll-Schicht</th>
                                    <th className="p-3.5 sm:p-4">Check-In</th>
                                    <th className="p-3.5 sm:p-4">Check-Out</th>
                                    <th className="p-3.5 sm:p-4 text-right">Arbeitszeit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] text-xs sm:text-sm">
                                {checkIns.map(c => {
                                    const checkInDate = new Date(c.checkInAt);
                                    const checkInTimeStr = checkInDate.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
                                    const dateStr = checkInDate.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });

                                    const checkOutDate = c.checkOutAt ? new Date(c.checkOutAt) : null;
                                    const checkOutTimeStr = checkOutDate ? checkOutDate.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }) : null;

                                    return (
                                        <tr key={c.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                                            <td className="p-3.5 sm:p-4 font-mono text-xs font-bold text-[var(--color-text)]">
                                                {dateStr}
                                            </td>

                                            <td className="p-3.5 sm:p-4">
                                                <div className="flex items-center gap-2.5 sm:gap-3">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)] shrink-0 print:hidden">
                                                        {c.barberImage ? (
                                                            <Image src={c.barberImage} alt={c.barberName} width={32} height={32} className="object-cover w-full h-full" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                                                                {c.barberName.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="font-bold text-[var(--color-text)]">{c.barberName}</span>
                                                </div>
                                            </td>

                                            <td className="p-3.5 sm:p-4 text-xs text-[var(--color-text-muted)] font-medium">
                                                {c.locationName} ({c.locationCity})
                                            </td>

                                            <td className="p-3.5 sm:p-4 font-mono text-xs text-[var(--color-text)]">
                                                {c.plannedStart ? (
                                                    <span>{c.plannedStart} - {c.plannedEnd || '?'} Uhr</span>
                                                ) : (
                                                    <span className="text-[var(--color-text-muted)] font-normal italic">Öffnungszeiten</span>
                                                )}
                                            </td>

                                            {/* Check-In Status */}
                                            <td className="p-3.5 sm:p-4 font-mono text-xs">
                                                <div className="font-bold text-[var(--color-text)]">{checkInTimeStr} Uhr</div>
                                                {c.status === 'LATE' ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500">
                                                        ⚠️ Verspätet (+{c.delayMinutes} Min)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                                        ✓ Pünktlich
                                                    </span>
                                                )}
                                            </td>

                                            {/* Check-Out Status */}
                                            <td className="p-3.5 sm:p-4 font-mono text-xs">
                                                {checkOutTimeStr ? (
                                                    <div>
                                                        <div className="font-bold text-[var(--color-text)]">{checkOutTimeStr} Uhr</div>
                                                        {c.isAutoCheckOut ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-400" title={c.note || 'Automatisch ausgecheckt'}>
                                                                ⚠️ Auto-Auscheck (Vergessen)
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                                                ✓ Regulär ausgecheckt
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 animate-pulse">
                                                        ⚪ Noch eingecheckt
                                                    </span>
                                                )}
                                            </td>

                                            {/* Total Worked Hours */}
                                            <td className="p-3.5 sm:p-4 text-right font-mono text-xs font-bold text-[var(--color-text)]">
                                                {formatDuration(c.checkInAt, c.checkOutAt)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
