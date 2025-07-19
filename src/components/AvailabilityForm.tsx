'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Availability = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  barberId: string;
};

type AvailabilityFormProps = {
  currentAvailabilities: Availability[];
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

export default function AvailabilityForm({ currentAvailabilities }: AvailabilityFormProps) {
  const [schedule, setSchedule] = useState(() => {
    const initialSchedule = new Map<number, { startTime: string; endTime: string; isActive: boolean }>();
    daysOfWeek.forEach(day => {
      const currentDay = currentAvailabilities.find(a => a.dayOfWeek === day.id);
      initialSchedule.set(day.id, {
        startTime: currentDay?.startTime || '09:00',
        endTime: currentDay?.endTime || '18:00',
        isActive: !!currentDay,
      });
    });
    return initialSchedule;
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      body: JSON.stringify(Object.fromEntries(schedule)),
    });

    if (res.ok) {
      alert('Arbeitszeiten erfolgreich gespeichert!');
      router.refresh();
    } else {
      alert('Ein Fehler ist aufgetreten.');
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-neutral-900 p-6 rounded-lg max-w-2xl mx-auto">
      <div className="space-y-4">
        {daysOfWeek.map(day => {
          const daySchedule = schedule.get(day.id)!;
          return (
            <div key={day.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`active-${day.id}`}
                  checked={daySchedule.isActive}
                  onChange={(e) => handleIsActiveChange(day.id, e.target.checked)}
                  className="h-5 w-5 rounded bg-neutral-700 border-neutral-600 text-gold-500 focus:ring-gold-500"
                />
                <label htmlFor={`active-${day.id}`} className="ml-3 text-lg font-medium">{day.name}</label>
              </div>
              <div className={`col-span-2 grid grid-cols-2 gap-4 ${!daySchedule.isActive ? 'opacity-50' : ''}`}>
                <input
                  type="time"
                  value={daySchedule.startTime}
                  onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                  disabled={!daySchedule.isActive}
                  className="bg-neutral-800 p-2 rounded w-full"
                />
                <input
                  type="time"
                  value={daySchedule.endTime}
                  onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                  disabled={!daySchedule.isActive}
                  className="bg-neutral-800 p-2 rounded w-full"
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-right">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-500 disabled:bg-neutral-600 transition-colors"
        >
          {isLoading ? 'Speichert...' : 'Speichern'}
        </button>
      </div>
    </form>
  );
}