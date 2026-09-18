'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationId: string | null;
  barberId: string | null;
};

type Location = {
  id: string;
  name: string;
};

type Barber = {
  id: string;
  name: string | null;
};

type AvailabilityFormProps = {
  availableLocations: Location[];
  allAvailabilities: Availability[];
  allBarbers?: Barber[];
};

const daysOfWeek = [
  { id: 1, name: 'Montag' },
  { id: 2, name: 'Dienstag' },
  { id: 3, name: 'Mittwoch' },
  { id: 4, name: 'Donnerstag' },
  { id: 5, name: 'Freitag' },
  { id: 6, name: 'Samstag' },
  { id: 0, name: 'Sonntag' },
];

type DaySchedule = { startTime: string; endTime: string; isActive: boolean };

export default function AvailabilityForm({
  availableLocations,
  allAvailabilities,
  allBarbers = [],
}: AvailabilityFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState(availableLocations[0]?.id || '');
  const [selectedBarberId, setSelectedBarberId] = useState<string>('all'); // 'all' = location default
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const buildSchedule = (locationId: string, barberId: string) => {
    // 1. If barber selected, check if barber has custom entries
    const targetBarberId = barberId !== 'all' ? barberId : null;
    const barberAvails = allAvailabilities.filter(
      a => a.locationId === locationId && a.barberId === targetBarberId
    );

    // 2. If barber has no entries, check location standard
    const locationAvails = allAvailabilities.filter(
      a => a.locationId === locationId && a.barberId === null
    );

    const availsToUse = barberAvails.length > 0 ? barberAvails : locationAvails;
    const isUsingCustom = barberAvails.length > 0;

    const schedule = new Map<number, DaySchedule>();
    daysOfWeek.forEach(day => {
      const existing = availsToUse.find(a => a.dayOfWeek === day.id);
      schedule.set(day.id, {
        startTime: existing?.startTime || '10:00',
        endTime: existing?.endTime || '19:00',
        isActive: !!existing,
      });
    });
    return { schedule, isUsingCustom };
  };

  const initial = buildSchedule(selectedLocationId, selectedBarberId);
  const [schedule, setSchedule] = useState<Map<number, DaySchedule>>(initial.schedule);
  const [hasCustomSchedule, setHasCustomSchedule] = useState<boolean>(initial.isUsingCustom);

  const handleLocationSwitch = (locId: string) => {
    setSelectedLocationId(locId);
    const updated = buildSchedule(locId, selectedBarberId);
    setSchedule(updated.schedule);
    setHasCustomSchedule(updated.isUsingCustom);
  };

  const handleBarberSwitch = (barberId: string) => {
    setSelectedBarberId(barberId);
    const updated = buildSchedule(selectedLocationId, barberId);
    setSchedule(updated.schedule);
    setHasCustomSchedule(updated.isUsingCustom);
  };

  const handleTimeChange = (dayId: number, field: 'startTime' | 'endTime', value: string) => {
    const newSchedule = new Map(schedule);
    const day = newSchedule.get(dayId)!;
    newSchedule.set(dayId, { ...day, [field]: value });
    setSchedule(newSchedule);
  };

  const handleIsActiveChange = (dayId: number, isActive: boolean) => {
    const newSchedule = new Map(schedule);
    const day = newSchedule.get(dayId)!;
    newSchedule.set(dayId, { ...day, isActive });
    setSchedule(newSchedule);
  };

  const handleResetToDefault = async () => {
    if (selectedBarberId === 'all') return;
    if (!confirm('Möchtest du die individuellen Arbeitszeiten dieses Barbers löschen und auf den Standort-Standard zurücksetzen?')) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/availability/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          barberId: selectedBarberId,
          schedule: {}, // empty schedule deletes custom rows
        }),
      });

      if (res.ok) {
        alert('Erfolgreich auf Standort-Standard zurückgesetzt!');
        router.refresh();
      } else {
        alert('Fehler beim Zurücksetzen.');
      }
    } catch (err) {
      console.error(err);
      alert('Fehler beim Zurücksetzen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/availability/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId: selectedLocationId,
          barberId: selectedBarberId !== 'all' ? selectedBarberId : null,
          schedule: Object.fromEntries(schedule),
        }),
      });

      if (res.ok) {
        alert(
          selectedBarberId === 'all'
            ? 'Standort-Öffnungszeiten erfolgreich gespeichert!'
            : 'Arbeitszeiten für Barber erfolgreich gespeichert!'
        );
        router.refresh();
      } else {
        alert('Ein Fehler ist aufgetreten.');
      }
    } catch (err) {
      console.error(err);
      alert('Ein Fehler ist aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedLocation = availableLocations.find(l => l.id === selectedLocationId);
  const selectedBarber = allBarbers.find(b => b.id === selectedBarberId);

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 rounded-lg max-w-3xl mx-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Location Switcher */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {availableLocations.map(loc => (
          <button
            key={loc.id}
            type="button"
            onClick={() => handleLocationSwitch(loc.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shrink-0 ${
              selectedLocationId === loc.id
                ? 'bg-[var(--color-gold-500)] text-black shadow-md'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/80'
            }`}
          >
            📍 {loc.name}
          </button>
        ))}
      </div>

      {/* Barber Selector */}
      {allBarbers.length > 0 && (
        <div className="mb-6 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mb-1">
              Gültigkeit / Mitarbeiter
            </label>
            <select
              value={selectedBarberId}
              onChange={(e) => handleBarberSwitch(e.target.value)}
              className="w-full sm:w-auto bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-3 py-1.5 text-sm font-bold text-[var(--color-text)] outline-none focus:border-gold-500"
            >
              <option value="all">🏢 Standort-Standard (Alle Barber)</option>
              {allBarbers.map(b => (
                <option key={b.id} value={b.id}>
                  ✂️ {b.name || 'Barber'}
                </option>
              ))}
            </select>
          </div>

          {selectedBarberId !== 'all' && (
            <div className="flex items-center gap-2">
              {hasCustomSchedule ? (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Eigene Arbeitszeiten
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  Standort-Standard
                </span>
              )}

              {hasCustomSchedule && (
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  disabled={isLoading}
                  className="text-xs text-red-400 hover:text-red-300 underline font-medium"
                >
                  Zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        {selectedBarberId === 'all' ? (
          <>
            Öffnungszeiten für <strong>{selectedLocation?.name}</strong>. Gilt für alle Barber ohne individuelle Arbeitszeiten.
          </>
        ) : (
          <>
            Dauerhafte Arbeitszeiten für <strong>{selectedBarber?.name}</strong> am Standort <strong>{selectedLocation?.name}</strong>.
            Tage ohne Haken sind für den Barber nicht buchbar.
          </>
        )}
      </p>

      <div className="space-y-3">
        {daysOfWeek.map(day => {
          const daySchedule = schedule.get(day.id)!;
          return (
            <div key={day.id} className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
              <div className="flex items-center gap-3 mb-2">
                <input
                  type="checkbox"
                  id={`active-${day.id}`}
                  checked={daySchedule.isActive}
                  onChange={(e) => handleIsActiveChange(day.id, e.target.checked)}
                  className="h-5 w-5 rounded text-gold-500 focus:ring-gold-500 flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
                />
                <label htmlFor={`active-${day.id}`} className="text-sm md:text-base font-bold cursor-pointer">
                  {day.name} {!daySchedule.isActive && <span className="text-xs font-normal text-red-400 ml-2">(Frei / Nicht da)</span>}
                </label>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${!daySchedule.isActive ? 'opacity-30 pointer-events-none' : ''}`}>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5">Startzeit</label>
                  <input
                    type="time"
                    value={daySchedule.startTime}
                    onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                    disabled={!daySchedule.isActive}
                    className="p-2 rounded w-full text-sm font-mono"
                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5">Endzeit</label>
                  <input
                    type="time"
                    value={daySchedule.endTime}
                    onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                    disabled={!daySchedule.isActive}
                    className="p-2 rounded w-full text-sm font-mono"
                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          {selectedBarberId !== 'all' ? 'Speichert die Wochenarbeitszeiten für diesen Barber.' : 'Speichert die Standort-Öffnungszeiten.'}
        </span>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-colors shadow-md"
        >
          {isLoading ? 'Speichert...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}