'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { subDays } from 'date-fns';
import StatCard from './StatCard';
import RevenueChart from './RevenueChart';
import BookingHeatmap from './BookingHeatmap';

interface BarberSimple {
    id: string;
    name: string | null;
    image: string | null;
}

interface ServiceSimple {
    id: string;
    name: string;
}

interface DashboardClientProps {
    barbers: BarberSimple[];
    services: ServiceSimple[];
    userName: string | null;
    isFiltered: boolean;
    effectiveLocationIdsCount: number;
    availableLocations: { id: string; name: string }[];
    locationFilterComponent: React.ReactNode;
    hasDashboardPin?: boolean;
}

interface DashboardData {
    chartData: { name: string; value: number }[];
    totalRevenue: number;
    totalAppointments: number;
    newCustomersCount: number;
    topServiceName: string;
    topServiceCount: number;
    busiestDay: string;
    busiestDayCount: number;
    heatmapData: Record<string, number>;
    heatmapMax: number;
    returningCustomers: number;
    barberStats: { id: string; name: string; image: string | null; appointments: number; revenue: number }[];
    manualRevenue: number;
    manualTips: number;
    manualCount: number;
    avgRevenuePerAppointment: string;
}

// Custom Multi-Select Dropdown Component
function MultiSelectDropdown({
    label,
    options,
    selectedIds,
    onChange,
    placeholderAll = "Alle",
    placeholderNone = "Keine"
}: {
    label: string;
    options: { id: string; name: string }[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholderAll?: string;
    placeholderNone?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        (opt.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(x => x !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = () => {
        onChange(options.map(o => o.id));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    const getButtonText = () => {
        if (selectedIds.length === 0) return placeholderNone;
        if (selectedIds.length === options.length) return placeholderAll;
        if (selectedIds.length <= 2) {
            return options
                .filter(o => selectedIds.includes(o.id))
                .map(o => o.name)
                .join(", ");
        }
        return `${selectedIds.length} ausgewählt`;
    };

    return (
        <div className="relative flex-grow md:flex-grow-0" ref={dropdownRef}>
            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full md:w-56 p-2.5 text-left rounded-lg text-sm border flex justify-between items-center transition-all bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] hover:border-gold-500/50"
            >
                <span className="truncate mr-2 font-medium">{getButtonText()}</span>
                <svg className={`w-4 h-4 transition-transform duration-200 text-[var(--color-text-muted)] ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute left-0 mt-1.5 w-full md:w-64 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl z-30 max-h-80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.length > 5 && (
                        <div className="p-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Suchen..."
                                className="w-full p-2 text-xs rounded-lg border bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:border-gold-500"
                            />
                        </div>
                    )}
                    
                    <div className="flex justify-between px-3 py-2 text-xs border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                        <button type="button" onClick={handleSelectAll} className="text-gold-500 font-bold hover:text-gold-400 transition-colors">Alle wählen</button>
                        <button type="button" onClick={handleClearAll} className="text-red-500 font-bold hover:text-red-400 transition-colors">Alle abwählen</button>
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
                        {filteredOptions.map(opt => {
                            const isChecked = selectedIds.includes(opt.id);
                            return (
                                <label
                                    key={opt.id}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer text-sm text-[var(--color-text)] transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => handleToggle(opt.id)}
                                        className="accent-gold-500 h-4.5 w-4.5 rounded border-neutral-700 bg-neutral-800"
                                    />
                                    <span className="truncate">{opt.name}</span>
                                </label>
                            );
                        })}
                        {filteredOptions.length === 0 && (
                            <p className="text-center text-xs text-[var(--color-text-muted)] py-6">Keine Optionen gefunden.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardClient({
    barbers,
    services,
    userName,
    isFiltered,
    effectiveLocationIdsCount,
    availableLocations,
    locationFilterComponent,
    hasDashboardPin = false
}: DashboardClientProps) {
    const [range, setRange] = useState('30d');
    const [startDate, setStartDate] = useState(subDays(new Date(), 30).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBarberIds, setSelectedBarberIds] = useState<string[]>(barbers.map(b => b.id));
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(services.map(s => s.id));

    // PIN Authentication States
    const [pinInput, setPinInput] = useState('');
    const [isPinVerified, setIsPinVerified] = useState(false);
    const [pinError, setPinError] = useState('');
    const [isVerifyingPin, setIsVerifyingPin] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        if (!hasDashboardPin) {
            setIsPinVerified(true);
        } else {
            const unlocked = sessionStorage.getItem('dashboard_unlocked') === 'true';
            setIsPinVerified(unlocked);
        }
        setIsCheckingSession(false);
    }, [hasDashboardPin]);

    const handleVerifyPin = async (e: React.FormEvent) => {
        e.preventDefault();
        setPinError('');
        setIsVerifyingPin(true);

        try {
            const res = await fetch('/api/admin/dashboard/verify-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pinInput })
            });

            if (res.ok) {
                sessionStorage.setItem('dashboard_unlocked', 'true');
                setIsPinVerified(true);
            } else {
                const err = await res.json();
                setPinError(err.error || 'Falscher PIN');
            }
        } catch (error) {
            console.error('Error verifying PIN:', error);
            setPinError('Fehler bei der Verbindung');
        } finally {
            setIsVerifyingPin(false);
        }
    };
    
    const [includeManual, setIncludeManual] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load for includeManual cookie
    useEffect(() => {
        const isIncluded = document.cookie.includes('include_manual_revenue=true');
        setIncludeManual(isIncluded);
    }, []);

    // Toggle include manual entries
    const toggleIncludeManual = () => {
        const newState = !includeManual;
        setIncludeManual(newState);
        document.cookie = `include_manual_revenue=${newState}; path=/; max-age=31536000`;
    };

    // Fetch dashboard data on filter change
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const queryParams: Record<string, string> = {
                    range,
                    barberIds: selectedBarberIds.length === barbers.length || selectedBarberIds.length === 0 ? 'all' : selectedBarberIds.join(','),
                    serviceIds: selectedServiceIds.length === services.length || selectedServiceIds.length === 0 ? 'all' : selectedServiceIds.join(','),
                };

                if (range === 'custom') {
                    queryParams.startDate = startDate;
                    queryParams.endDate = endDate;
                }

                const params = new URLSearchParams(queryParams);
                const res = await fetch(`/api/admin/dashboard?${params.toString()}`);
                const json = await res.json();

                if (res.ok) {
                    setData(json);
                }
            } catch (err) {
                console.error("Error fetching dashboard statistics:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [range, startDate, endDate, selectedBarberIds, selectedServiceIds, includeManual, barbers.length, services.length]);

    // Format display string for range
    const getRangeLabel = () => {
        switch (range) {
            case 'yesterday': return 'Gestern';
            case '7d': return 'Letzte 7 Tage';
            case '30d': return 'Letzte 30 Tage';
            case '3m': return 'Letzte 3 Monate';
            case '6m': return 'Letzte 6 Monate';
            case '12m': return 'Letzte 12 Monate';
            case 'all': return 'Gesamt';
            case 'custom': return `${startDate} bis ${endDate}`;
            default: return 'Letzte 30 Tage';
        }
    };

    if (isCheckingSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!isPinVerified) {
        return (
            <div className="container mx-auto max-w-md py-20 px-4 animate-in fade-in duration-500">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 rounded-2xl shadow-xl space-y-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center text-gold-500 text-3xl">
                        🔒
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-[var(--color-text)]">Dashboard gesperrt</h2>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Bitte gib den Dashboard-Sicherheits-PIN ein, um den Umsatzbericht freizugeben.
                        </p>
                    </div>
                    <form onSubmit={handleVerifyPin} className="space-y-4 text-left">
                        <div>
                            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase block mb-1">
                                Dashboard PIN
                            </label>
                            <input
                                type="password"
                                placeholder="PIN eingeben"
                                value={pinInput}
                                onChange={e => {
                                    setPinInput(e.target.value);
                                    setPinError('');
                                }}
                                className="w-full p-3 rounded-lg border border-[var(--color-border)] bg-transparent text-[var(--color-text)] text-center text-lg tracking-widest font-mono focus:ring-2 focus:ring-[var(--color-gold-500)] outline-none"
                                autoFocus
                            />
                        </div>
                        {pinError && (
                            <p className="text-xs font-semibold text-red-500 text-center">{pinError}</p>
                        )}
                        <button
                            type="submit"
                            disabled={isVerifyingPin}
                            className="w-full bg-[var(--color-gold-500)] text-black font-bold py-3 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isVerifyingPin ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Dashboard freigeben'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-6 print:hidden">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)]">Dashboard</h1>
                        {isLoading && (
                            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                    </div>
                    <p className="mt-2 text-[var(--color-text-muted)]">
                        Willkommen zurück, {userName}.
                        {isFiltered ? ` Gefilterte Ansicht (${effectiveLocationIdsCount} Standort/e).` : ' Gesamtübersicht.'}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {isFiltered && (
                        <span className="hidden md:inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100/10 text-blue-400 border border-blue-500/20">
                            Gefiltert: {effectiveLocationIdsCount} Standort(e)
                        </span>
                    )}
                    {availableLocations.length > 1 && (
                        <div className="relative z-20">
                            {locationFilterComponent}
                        </div>
                    )}
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-neutral-800 text-white hover:bg-neutral-700 transition-all border border-[var(--color-border)] shadow-md"
                    >
                        🖨️ Bericht drucken / PDF
                    </button>
                </div>
            </div>

            <div className="hidden print:block border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold text-black">ALKOS BARBERSHOP — UMSATZBERICHT</h1>
                <p className="text-sm text-neutral-600 mt-1">
                    Zeitraum: <span className="font-bold">{getRangeLabel()}</span> | 
                    Erstellt am: {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE')} Uhr
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                    Filter: 
                    Barber: {selectedBarberIds.length === barbers.length ? 'Alle' : `${selectedBarberIds.length} von ${barbers.length}`} | 
                    Services: {selectedServiceIds.length === services.length ? 'Alle' : `${selectedServiceIds.length} von ${services.length}`}
                </p>
            </div>

            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-6 rounded-2xl shadow-sm space-y-4 print:hidden z-10 relative">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Berichtsfilter</h3>
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow md:flex-grow-0">
                        <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">
                            Zeitrahmen
                        </label>
                        <select
                            value={range}
                            onChange={(e) => setRange(e.target.value)}
                            className="w-full md:w-48 p-2.5 rounded-lg text-sm border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] focus:border-gold-500 font-medium"
                        >
                            <option value="yesterday">Gestern</option>
                            <option value="7d">Letzte 7 Tage</option>
                            <option value="30d">Letzte 30 Tage</option>
                            <option value="3m">Letzte 3 Monate</option>
                            <option value="6m">Letzte 6 Monate</option>
                            <option value="12m">Letzte 12 Monate</option>
                            <option value="all">Gesamt</option>
                            <option value="custom">Eigener Zeitraum...</option>
                        </select>
                    </div>

                    {range === 'custom' && (
                        <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in slide-in-from-left-2 duration-300">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Von</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="p-2.5 rounded-lg text-sm border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)]"
                                />
                            </div>
                            <span className="text-[var(--color-text-muted)] mt-6">bis</span>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1 uppercase tracking-wider">Bis</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="p-2.5 rounded-lg text-sm border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)]"
                                />
                            </div>
                        </div>
                    )}

                    <MultiSelectDropdown
                        label="Friseure / Mitarbeiter"
                        options={barbers.map(b => ({ id: b.id, name: b.name || 'Unbenannt' }))}
                        selectedIds={selectedBarberIds}
                        onChange={setSelectedBarberIds}
                        placeholderAll="Alle Mitarbeiter"
                        placeholderNone="Keine Mitarbeiter"
                    />

                    <MultiSelectDropdown
                        label="Dienstleistungen"
                        options={services}
                        selectedIds={selectedServiceIds}
                        onChange={setSelectedServiceIds}
                        placeholderAll="Alle Services"
                        placeholderNone="Keine Services"
                    />
                </div>
            </div>

            {data && (data.manualCount > 0 || includeManual) && (
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-sm transition-all hover:border-[var(--color-gold-500)]/30 print:hidden">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                                📝 Manuell erfasste Umsätze
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-xl">
                                Für den gewählten Zeitraum wurden **{data.manualCount} Termine** mit **{data.manualRevenue.toFixed(2)}€** Umsatz {includeManual ? 'inkludiert' : 'erfasst (aber ausgeblendet)'}.
                                {data.manualTips > 0 && <span className="text-green-500 font-medium block mt-0.5">Trinkgeld im Zeitraum: +{data.manualTips.toFixed(2)}€</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)]">
                            <span className="text-sm font-bold text-[var(--color-text-muted)]">Ins Dashboard aufnehmen?</span>
                            <button
                                onClick={toggleIncludeManual}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${
                                    includeManual ? 'bg-[var(--color-gold-500)]' : 'bg-neutral-600'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        includeManual ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative min-h-[400px]">
                {isLoading && !data && (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[var(--color-text-muted)] font-bold animate-pulse text-lg">Statistiken werden berechnet...</p>
                    </div>
                )}

                {isLoading && data && (
                    <div className="absolute inset-0 bg-[var(--color-background)]/30 backdrop-blur-[2px] z-20 flex items-center justify-center rounded-2xl pointer-events-auto print:hidden">
                        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border-gold-500/20">
                            <div className="w-5 h-5 border-2 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-bold text-[var(--color-text)]">Daten werden aktualisiert...</span>
                        </div>
                    </div>
                )}

                {data && (
                    <div className={`space-y-12 transition-all duration-300 ${isLoading ? 'opacity-40 pointer-events-none filter blur-[0.5px]' : ''}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-6 print:gap-4">
                            <StatCard
                                title="Umsatz (Brutto)"
                                value={`${data.totalRevenue.toFixed(2)} €`}
                                subtext={getRangeLabel()}
                            />
                            <StatCard
                                title="Buchungen"
                                value={data.totalAppointments.toString()}
                                subtext={getRangeLabel()}
                            />
                            <StatCard
                                title="⌀ Umsatz/Termin"
                                value={`${data.avgRevenuePerAppointment} €`}
                                subtext={getRangeLabel()}
                            />
                            <StatCard
                                title="Top Dienstleistung"
                                value={data.topServiceName}
                                subtext={data.topServiceCount > 0 ? `${data.topServiceCount} Buchungen` : ''}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 gap-6 print:gap-4">
                            <StatCard
                                title="Neue Kunden"
                                value={data.newCustomersCount.toString()}
                                subtext="Neuanmeldungen im Zeitraum"
                            />
                            <StatCard
                                title="Stärkster Tag"
                                value={data.busiestDay}
                                subtext={data.busiestDayCount > 0 ? `${data.busiestDayCount} Termine im Zeitraum` : ''}
                            />
                            <StatCard
                                title="Stammkunden"
                                value={data.returningCustomers.toString()}
                                subtext="Kunden mit 2+ Buchungen"
                            />
                            <StatCard
                                title="Trinkgeld (Manuell)"
                                value={`${data.manualTips.toFixed(2)} €`}
                                subtext="Wird separat ausgewiesen"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-1 flex flex-col gap-8 print:col-span-3">
                                <div className="space-y-6 print:break-inside-avoid">
                                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[var(--color-text)] print:text-black">
                                        Team Performance
                                        <span className="text-xs font-normal text-[var(--color-text-muted)] print:text-neutral-500 ml-2">({getRangeLabel()})</span>
                                    </h2>

                                    <div className="hidden md:block print:block rounded-xl border border-[var(--color-border)] print:border-neutral-300 bg-[var(--color-surface)] print:bg-white overflow-hidden shadow-sm">
                                        <table className="min-w-full divide-y divide-[var(--color-border)] print:divide-neutral-300">
                                            <thead className="bg-[var(--color-surface-2)] print:bg-neutral-100">
                                                <tr>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] print:text-neutral-700 uppercase tracking-wider print:border-b print:border-neutral-300">Mitarbeiter</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] print:text-neutral-700 uppercase tracking-wider print:border-b print:border-neutral-300">Termine</th>
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] print:text-neutral-700 uppercase tracking-wider print:border-b print:border-neutral-300">Umsatz</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[var(--color-border)] print:divide-neutral-200">
                                                {data.barberStats.map((barber) => (
                                                    <tr key={barber.name} className="hover:bg-[var(--color-surface-2)] print:hover:bg-transparent transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text)] print:text-neutral-900 flex items-center gap-3">
                                                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] print:hidden">
                                                                {barber.image ? (
                                                                    <Image src={barber.image} alt={barber.name} fill className="object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] text-xs">
                                                                        {barber.name.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span>{barber.name}</span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)] print:text-neutral-600">{barber.appointments}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-text)] print:text-neutral-900">{barber.revenue.toFixed(2)} €</td>
                                                    </tr>
                                                ))}
                                                {data.barberStats.length === 0 && (
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-[var(--color-text-muted)] print:text-neutral-500">Keine Daten vorhanden.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="md:hidden space-y-4 print:hidden">
                                        {data.barberStats.map((barber) => (
                                            <div key={barber.name} className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-inner print:hidden">
                                                        {barber.image ? (
                                                            <Image src={barber.image} alt={barber.name} fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-muted)] font-bold">
                                                                {barber.name.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[var(--color-text)]">{barber.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">{barber.appointments} Termine</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gold-500 text-lg">{barber.revenue.toFixed(2)} €</p>
                                                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Umsatz</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4 print:hidden">
                                    <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                                        Buchungs-Heatmap
                                        <span className="text-xs font-normal text-[var(--color-text-muted)] ml-2">({getRangeLabel()})</span>
                                    </h2>
                                    <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
                                        <BookingHeatmap data={data.heatmapData} maxCount={data.heatmapMax} />
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-2 space-y-6 print:hidden">
                                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Umsatzverlauf</h2>
                                <div className="min-h-[300px]">
                                    <RevenueChart
                                        data={data.chartData}
                                        total={data.totalRevenue}
                                        count={data.totalAppointments}
                                        isLoading={false}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="hidden print:block space-y-4 mt-8 print:break-inside-avoid">
                            <h2 className="text-xl font-bold text-black border-b-2 border-black pb-2">Umsatzverlauf (Tabelle)</h2>
                            <table className="min-w-full divide-y divide-neutral-300 border border-neutral-300 text-left">
                                <thead className="bg-neutral-100">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider border border-neutral-300">Zeitpunkt / Datum</th>
                                        <th className="px-4 py-3 text-xs font-bold text-neutral-700 uppercase tracking-wider border border-neutral-300">Umsatz</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 bg-white">
                                    {data.chartData.map((item, idx) => (
                                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}>
                                            <td className="px-4 py-2 text-sm text-neutral-900 border border-neutral-300">{item.name}</td>
                                            <td className="px-4 py-2 text-sm font-bold text-neutral-900 border border-neutral-300">{item.value.toFixed(2)} €</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-neutral-100 font-bold">
                                        <td className="px-4 py-3 text-sm text-neutral-900 border border-neutral-300">Gesamt</td>
                                        <td className="px-4 py-3 text-sm text-neutral-900 border border-neutral-300">{data.totalRevenue.toFixed(2)} €</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
