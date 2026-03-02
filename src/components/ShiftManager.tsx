'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Location = { id: string; name: string };
type Barber = { id: string; name: string | null };

type Shift = {
    id: string;
    barberId: string;
    locationId: string;
    date: string;
    startTime: string;
    endTime: string;
    note: string | null;
    barber: { name: string | null };
    location: { name: string };
};

type ShiftManagerProps = {
    availableLocations: Location[];
    allBarbers: Barber[];
};

export default function ShiftManager({ availableLocations, allBarbers }: ShiftManagerProps) {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        barberId: allBarbers[0]?.id || '',
        locationId: availableLocations[0]?.id || '',
        date: '',
        startTime: '09:00',
        endTime: '18:00',
        note: '',
    });

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        const res = await fetch('/api/admin/shifts');
        if (res.ok) {
            setShifts(await res.json());
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.date) {
            alert('Bitte Datum auswählen');
            return;
        }
        setIsLoading(true);
        const res = await fetch('/api/admin/shifts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form),
        });

        if (res.ok) {
            setForm({ ...form, date: '', note: '' });
            setShowForm(false);
            await fetchShifts();
            router.refresh();
        } else {
            const data = await res.json();
            alert(data.error || 'Fehler beim Speichern');
        }
        setIsLoading(false);
    };

    const handleDelete = async (shiftId: string) => {
        if (!confirm('Diesen Schicht-Override wirklich löschen?')) return;
        const res = await fetch(`/api/admin/shifts?id=${shiftId}`, { method: 'DELETE' });
        if (res.ok) {
            await fetchShifts();
            router.refresh();
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('de-DE', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
        });
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-[var(--color-text-muted)]">
                    Einmalige Standort-Übersteuerungen für bestimmte Tage. Overrides haben Vorrang vor den regulären Arbeitszeiten.
                </p>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="text-sm font-bold bg-[var(--color-gold-500)] text-black px-4 py-2 rounded-lg hover:brightness-110 transition-all flex-shrink-0"
                >
                    {showForm ? 'Abbrechen' : '+ Override'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] mb-6 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-bold opacity-60 mb-1">Barber</label>
                            <select
                                value={form.barberId}
                                onChange={(e) => setForm({ ...form, barberId: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                            >
                                {allBarbers.map(b => (
                                    <option key={b.id} value={b.id}>{b.name || b.id}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold opacity-60 mb-1">Standort (Override)</label>
                            <select
                                value={form.locationId}
                                onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                            >
                                {availableLocations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-bold opacity-60 mb-1">Datum</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full p-2 rounded border text-sm"
                                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold opacity-60 mb-1">Von</label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold opacity-60 mb-1">Bis</label>
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                className="w-full p-2 rounded border text-sm"
                                style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold opacity-60 mb-1">Notiz (optional)</label>
                        <input
                            type="text"
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            placeholder="z.B. Aushilfe wegen Krankheit"
                            className="w-full p-2 rounded border text-sm"
                            style={{ backgroundColor: 'var(--color-surface-2)', borderColor: 'var(--color-border)' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[var(--color-gold-500)] text-black font-bold px-6 py-2 rounded hover:brightness-110 transition-all text-sm"
                    >
                        {isLoading ? 'Speichert...' : 'Override speichern'}
                    </button>
                </form>
            )}

            {/* Upcoming Shifts */}
            {shifts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)] text-center py-6">Keine aktiven Overrides vorhanden.</p>
            ) : (
                <div className="space-y-2">
                    {shifts.map(shift => (
                        <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-bold">{shift.barber.name}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-gold-500)] text-black font-bold">{shift.location.name}</span>
                                </div>
                                <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                    {formatDate(shift.date)} · {shift.startTime} – {shift.endTime}
                                    {shift.note && <span className="ml-2 italic">({shift.note})</span>}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(shift.id)}
                                className="text-red-500 hover:bg-red-500/10 p-1.5 rounded text-xs font-bold flex-shrink-0 ml-2"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
