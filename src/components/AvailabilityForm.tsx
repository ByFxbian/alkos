'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  locationId: string | null;
};

type Location = {
  id: string;
  name: string;
};

type AvailabilityFormProps = {
  availableLocations: Location[];
  currentAvailabilities: Record<string, Availability[]>; // locationId -> availabilities
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

export default function AvailabilityForm({ availableLocations, currentAvailabilities }: AvailabilityFormProps) {
  const [selectedLocationId, setSelectedLocationId] = useState(availableLocations[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const buildScheduleForLocation = (locationId: string) => {
    const locationAvails = currentAvailabilities[locationId] || [];
    const schedule = new Map<number, DaySchedule>();
    daysOfWeek.forEach(day => {
      const existing = locationAvails.find(a => a.dayOfWeek === day.id);
      schedule.set(day.id, {
        startTime: existing?.startTime || '09:00',
        endTime: existing?.endTime || '18:00',
        isActive: !!existing,
      });
    });
    return schedule;
  };

  const [schedule, setSchedule] = useState(() => buildScheduleForLocation(selectedLocationId));

  const handleLocationSwitch = (locId: string) => {
    setSelectedLocationId(locId);
    setSchedule(buildScheduleForLocation(locId));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await fetch('/api/availability/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locationId: selectedLocationId,
        schedule: Object.fromEntries(schedule),
      }),
    });

    if (res.ok) {
      alert('Öffnungszeiten erfolgreich gespeichert!');
      router.refresh();
    } else {
      alert('Ein Fehler ist aufgetreten.');
    }
    setIsLoading(false);
  };

  const selectedLocation = availableLocations.find(l => l.id === selectedLocationId);

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 rounded-lg max-w-3xl mx-auto" style={{ backgroundColor: 'var(--color-surface)' }}>
      {/* Location Tabs */}
      <div className="flex gap-2 mb-6">
        {availableLocations.map(loc => (
          <button
            key={loc.id}
            type="button"
            onClick={() => handleLocationSwitch(loc.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedLocationId === loc.id
                ? 'bg-[var(--color-gold-500)] text-black shadow-md'
                : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]/80'
            }`}
          >
            {loc.name}
          </button>
        ))}
      </div>

      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Öffnungszeiten für <strong>{selectedLocation?.name}</strong>. Gilt für alle Barber an diesem Standort.
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
                <label htmlFor={`active-${day.id}`} className="text-sm md:text-base font-bold">{day.name}</label>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${!daySchedule.isActive ? 'opacity-30 pointer-events-none' : ''}`}>
                <input
                  type="time"
                  value={daySchedule.startTime}
                  onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                  disabled={!daySchedule.isActive}
                  className="p-2 rounded w-full text-sm"
                  style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                />
                <input
                  type="time"
                  value={daySchedule.endTime}
                  onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                  disabled={!daySchedule.isActive}
                  className="p-2 rounded w-full text-sm"
                  style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 text-right">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Speichert...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}