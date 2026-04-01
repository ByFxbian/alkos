'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';

interface Barber {
  id: string;
  name: string;
  image: string | null;
  hasPin: boolean;
}

interface LocationInfo {
  id: string;
  name: string;
}

interface ManualEntry {
  id: string;
  serviceName: string;
  price: number;
  tip: number;
  duration: number | null;
  notes: string | null;
  date: string;
  location: { id: string; name: string };
  barber: { id: string; name: string; image: string | null };
}

interface Props {
  currentUserId: string;
  isBarberOnly: boolean;
  userRole: string;
  barbers: Barber[];
  locations: LocationInfo[];
}

export default function AdminManualEntries({ currentUserId, isBarberOnly, userRole, barbers, locations }: Props) {
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTips, setTotalTips] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  // Filters
  const [filterBarberId, setFilterBarberId] = useState('all');
  const [filterLocationId, setFilterLocationId] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // PIN setting
  const [pinModalBarberId, setPinModalBarberId] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (isBarberOnly) {
        params.set('barberId', currentUserId);
      } else if (filterBarberId !== 'all') {
        params.set('barberId', filterBarberId);
      }
      if (filterLocationId !== 'all') params.set('locationId', filterLocationId);
      if (filterStartDate) params.set('startDate', filterStartDate);
      if (filterEndDate) params.set('endDate', filterEndDate);

      const res = await fetch(`/api/manual-entry?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setTotalRevenue(data.totalRevenue || 0);
        setTotalTips(data.totalTips || 0);
        setTotalEntries(data.totalEntries || 0);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }, [currentUserId, isBarberOnly, filterBarberId, filterLocationId, filterStartDate, filterEndDate]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleSetPin = async () => {
    if (!pinModalBarberId || !pinInput || pinInput.length < 4 || !/^\d+$/.test(pinInput)) {
      setPinMessage('PIN muss mindestens 4 Ziffern haben');
      return;
    }
    setPinSaving(true);
    setPinMessage(null);
    try {
      const res = await fetch('/api/admin/barber-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barberId: pinModalBarberId, pin: pinInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setPinMessage('✅ PIN erfolgreich gesetzt!');
        setPinInput('');
        setTimeout(() => { setPinModalBarberId(null); setPinMessage(null); }, 1500);
      } else {
        setPinMessage(data.error || 'Fehler');
      }
    } catch {
      setPinMessage('Netzwerkfehler');
    } finally {
      setPinSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/manual-entry/${entryId}`, { method: 'DELETE' });
      if (res.ok) fetchEntries();
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--color-text)]">Manuelle Einträge</h1>
          <p className="mt-1 text-[var(--color-text-muted)] text-sm">
            {isBarberOnly ? 'Deine manuell erfassten Termine' : 'Übersicht aller manuellen Termine'}
          </p>
        </div>
        {!isBarberOnly && ['ADMIN', 'HEADOFBARBER'].includes(userRole) && (
          <a
            href="/manual-entry"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors border border-[var(--color-border)] hover:bg-[var(--color-gold-500)] hover:text-black hover:border-[var(--color-gold-500)]"
          >
            📝 Zur Eintragsseite
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Einträge</p>
          <p className="text-3xl font-bold mt-1 text-[var(--color-text)]">{totalEntries}</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Umsatz</p>
          <p className="text-3xl font-bold mt-1 text-[var(--color-gold-500)]">{totalRevenue.toFixed(2)}€</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Trinkgeld</p>
          <p className="text-3xl font-bold mt-1 text-green-500">{totalTips.toFixed(2)}€</p>
        </div>
        <div className="p-5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">⌀ pro Eintrag</p>
          <p className="text-3xl font-bold mt-1 text-[var(--color-text)]">{totalEntries > 0 ? (totalRevenue / totalEntries).toFixed(2) : '0.00'}€</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        {!isBarberOnly && (
          <select
            value={filterBarberId}
            onChange={e => setFilterBarberId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold-500)]"
          >
            <option value="all">Alle Barber</option>
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}

        {locations.length > 1 && (
          <select
            value={filterLocationId}
            onChange={e => setFilterLocationId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold-500)]"
          >
            <option value="all">Alle Standorte</option>
            {locations.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        <input
          type="date"
          value={filterStartDate}
          onChange={e => setFilterStartDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold-500)] [color-scheme:dark]"
          placeholder="Von"
        />
        <input
          type="date"
          value={filterEndDate}
          onChange={e => setFilterEndDate(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm text-[var(--color-text)] focus:outline-none focus:border-[var(--color-gold-500)] [color-scheme:dark]"
          placeholder="Bis"
        />

        {(filterStartDate || filterEndDate || filterBarberId !== 'all' || filterLocationId !== 'all') && (
          <button
            onClick={() => { setFilterBarberId('all'); setFilterLocationId('all'); setFilterStartDate(''); setFilterEndDate(''); }}
            className="px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
          >
            ✕ Reset
          </button>
        )}
      </div>

      {!isBarberOnly && ['ADMIN', 'HEADOFBARBER'].includes(userRole) && (
        <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">🔑 Barber PINs verwalten</h3>
          <div className="flex flex-wrap gap-2">
            {barbers.filter(b => ['BARBER', 'HEADOFBARBER'].includes(userRole) || true).map(b => (
              <button
                key={b.id}
                onClick={() => { setPinModalBarberId(b.id); setPinInput(''); setPinMessage(null); }}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  b.hasPin
                    ? 'border-green-500/30 bg-green-900/10 text-green-400 hover:bg-green-900/20'
                    : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)]'
                }`}
              >
                {b.image ? (
                  <Image src={b.image} alt={b.name} width={20} height={20} className="rounded-full object-cover" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs">{b.name.charAt(0)}</span>
                )}
                {b.name}
                {b.hasPin ? ' ✓' : ' (kein PIN)'}
              </button>
            ))}
          </div>
        </div>
      )}

      {pinModalBarberId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPinModalBarberId(null)}>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-1">PIN setzen</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-4">
              Für: {barbers.find(b => b.id === pinModalBarberId)?.name}
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              value={pinInput}
              onChange={e => { if (/^\d*$/.test(e.target.value)) setPinInput(e.target.value); }}
              placeholder="Mindestens 4 Ziffern"
              maxLength={8}
              className="w-full p-4 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-gold-500)] focus:outline-none text-[var(--color-text)] text-center text-2xl tracking-[0.5em] font-mono mb-4"
              autoFocus
            />
            {pinMessage && (
              <p className={`text-sm mb-3 text-center ${pinMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {pinMessage}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setPinModalBarberId(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSetPin}
                disabled={pinSaving || pinInput.length < 4}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-black transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-gold-500)' }}
              >
                {pinSaving ? 'Speichern...' : 'PIN speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="hidden md:block rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surface-3)]">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Datum</th>
              {!isBarberOnly && <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Barber</th>}
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Service</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Preis</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Trinkgeld</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Dauer</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Standort</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Notizen</th>
              {!isBarberOnly && <th className="px-5 py-4 text-right text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {isLoading ? (
              <tr>
                <td colSpan={isBarberOnly ? 7 : 9} className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-gold-500)] border-t-transparent mx-auto mb-3" />
                  Lade Einträge...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={isBarberOnly ? 7 : 9} className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]">
                  Keine Einträge gefunden
                </td>
              </tr>
            ) : (
              entries.map(entry => (
                <tr key={entry.id} className="hover:bg-[var(--color-surface-3)] transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-[var(--color-text)]">
                    {format(new Date(entry.date), 'dd.MM.yy', { locale: de })}
                  </td>
                  {!isBarberOnly && (
                    <td className="px-5 py-3 text-sm text-[var(--color-text)]">
                      <div className="flex items-center gap-2">
                        {entry.barber.image ? (
                          <Image src={entry.barber.image} alt={entry.barber.name} width={24} height={24} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs text-[var(--color-text-muted)]">{entry.barber.name.charAt(0)}</div>
                        )}
                        {entry.barber.name}
                      </div>
                    </td>
                  )}
                  <td className="px-5 py-3 text-sm font-medium text-[var(--color-text)]">{entry.serviceName}</td>
                  <td className="px-5 py-3 text-sm font-bold text-[var(--color-gold-500)]">{entry.price.toFixed(2)}€</td>
                  <td className="px-5 py-3 text-sm text-green-500">{entry.tip > 0 ? `${entry.tip.toFixed(2)}€` : '-'}</td>
                  <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{entry.duration ? `${entry.duration} Min` : '-'}</td>
                  <td className="px-5 py-3 text-sm text-[var(--color-text-muted)]">{entry.location.name}</td>
                  <td className="px-5 py-3 text-sm text-[var(--color-text-muted)] max-w-[150px] truncate">{entry.notes || '-'}</td>
                  {!isBarberOnly && (
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        🗑️
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-gold-500)] border-t-transparent mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-muted)]">Lade Einträge...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
            <p className="text-[var(--color-text-muted)]">Keine Einträge gefunden</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-[var(--color-text)]">{entry.serviceName}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {format(new Date(entry.date), 'dd.MM.yyyy', { locale: de })}
                    {entry.duration && ` • ${entry.duration} Min`}
                  </p>
                  {!isBarberOnly && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      👤 {entry.barber.name} • 📍 {entry.location.name}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-[var(--color-gold-500)]">{entry.price.toFixed(2)}€</p>
                  {entry.tip > 0 && <p className="text-xs text-green-500">+{entry.tip.toFixed(2)}€</p>}
                </div>
              </div>
              {entry.notes && <p className="text-xs text-[var(--color-text-muted)] italic">💬 {entry.notes}</p>}
              {!isBarberOnly && (
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-900/20 text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    🗑️ Löschen
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
