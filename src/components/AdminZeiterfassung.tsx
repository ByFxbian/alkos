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
    plannedStart: string;
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

    const totalCheckIns = checkIns.length;
    const lateCheckIns = checkIns.filter(c => c.status === 'LATE');
    const onTimeCheckIns = checkIns.filter(c => c.status === 'ON_TIME');
    const totalDelayMinutes = checkIns.reduce((acc, c) => acc + (c.delayMinutes || 0), 0);
    const onTimeRate = totalCheckIns > 0 ? Math.round((onTimeCheckIns.length / totalCheckIns) * 100) : 100;

    const handlePdfExport = () => {
        window.print();
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h2 className="text-2xl font-extrabold text-[var(--color-text)]">Zeiterfassung & Pünktlichkeit</h2>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        Protokoll der Mitarbeiter Morgen-Check-ins und Verspätungen.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-gold-400 transition-all shadow-md"
                    >
                        📄 PDF Export
                    </button>
                </div>
            </div>

            <div className="hidden print:block text-center border-b pb-6 mb-6">
                <h1 className="text-2xl font-black tracking-tight text-black">ALKOS BARBERSHOP — ZEITERFASSUNG & PÜNKTLICHKEIT</h1>
                <p className="text-xs text-neutral-600 mt-1">
                    Monat: {selectedMonth} | Standort: {selectedLocationId ? locations.find(l => l.id === selectedLocationId)?.name : 'Alle Standorte'} | Erstellt am: {new Date().toLocaleDateString('de-AT')}
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Gesamt Check-ins</span>
                    <span className="text-3xl font-black text-[var(--color-text)] mt-1 block">{totalCheckIns}</span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Pünktlich Quote</span>
                    <span className="text-3xl font-black text-emerald-400 mt-1 block">{onTimeRate}%</span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Verspätungen</span>
                    <span className="text-3xl font-black text-amber-400 mt-1 block">{lateCheckIns.length}</span>
                </div>

                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] block">Verspätung Gesamt</span>
                    <span className="text-3xl font-black text-red-400 mt-1 block">{totalDelayMinutes} <span className="text-xs font-normal">Min.</span></span>
                </div>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none">
                {isLoading ? (
                    <div className="p-12 text-center text-xs text-[var(--color-text-muted)] animate-pulse">
                        Lade Zeiterfassungsdaten...
                    </div>
                ) : checkIns.length === 0 ? (
                    <div className="p-12 text-center text-xs text-[var(--color-text-muted)]">
                        Keine Check-in Protokolle für den ausgewählten Zeitraum gefunden.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] font-bold">
                                    <th className="p-4">Datum & Zeit</th>
                                    <th className="p-4">Mitarbeiter</th>
                                    <th className="p-4">Standort</th>
                                    <th className="p-4">Soll-Schicht</th>
                                    <th className="p-4 text-right">Status / Verspätung</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)] text-sm">
                                {checkIns.map(c => {
                                    const checkInDate = new Date(c.checkInAt);
                                    const timeStr = checkInDate.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' });
                                    const dateStr = checkInDate.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });

                                    return (
                                        <tr key={c.id} className="hover:bg-[var(--color-surface-2)]/50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-[var(--color-text)]">
                                                <span className="font-bold">{dateStr}</span>
                                                <span className="block text-[11px] text-[var(--color-text-muted)]">{timeStr} Uhr</span>
                                            </td>

                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface-3)] shrink-0 print:hidden">
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

                                            <td className="p-4 text-xs text-[var(--color-text-muted)] font-medium">
                                                {c.locationName} ({c.locationCity})
                                            </td>

                                            <td className="p-4 font-mono text-xs text-[var(--color-text)]">
                                                {c.plannedStart !== 'Keine Schicht' ? `${c.plannedStart} Uhr` : <span className="text-[var(--color-text-muted)] font-normal italic">Keine Schicht</span>}
                                            </td>

                                            <td className="p-4 text-right font-mono text-xs">
                                                {c.status === 'LATE' ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-500 font-bold rounded-lg border border-amber-500/20">
                                                        ⚠️ Verspätet (+{c.delayMinutes} Min)
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20">
                                                        ✓ Pünktlich
                                                    </span>
                                                )}
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
