'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import LoadingModal from './LoadingModal';
import { Role } from '@/generated/prisma';

type BlockedTimeWithBarber = {
  id: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
  barber: {
    name: string | null;
  };
};

type BarberSelection = {
  id: string;
  name: string | null;
};

type BlockedTimeManagerProps = {
  existingBlocks: BlockedTimeWithBarber[];
  allBarbers: BarberSelection[];
  currentUserId: string;
  currentUserRole: Role;
};

const getStartOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

const getEndOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
}

export function BlockedTimeManager({ 
  existingBlocks, 
  allBarbers, 
  currentUserId, 
  currentUserRole 
}: BlockedTimeManagerProps) {
const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const [targetBarberId, setTargetBarberId] = useState<string>(currentUserId);

  const isAdminOrHead = currentUserRole === 'ADMIN' || currentUserRole === 'HEADOFBARBER';

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!date) {
        setError('Bitte wähle ein Datum.');
        setIsLoading(false);
        return;
    }

    const selectedDate = new Date(date);
    let finalStartTime: Date;
    let finalEndTime: Date;

    if (isFullDay) {
        finalStartTime = getStartOfDay(selectedDate);
        finalEndTime = getEndOfDay(selectedDate);
    } else {
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        finalStartTime = new Date(selectedDate);
        finalStartTime.setHours(startHour, startMinute, 0, 0);

        finalEndTime = new Date(selectedDate);
        finalEndTime.setHours(endHour, endMinute, 0, 0);

        if (finalEndTime <= finalStartTime) {
            setError('Endzeit muss nach der Startzeit liegen.');
            setIsLoading(false);
            return;
        }
    }

    try {
      const res = await fetch('/api/admin/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: finalStartTime.toISOString(),
          endTime: finalEndTime.toISOString(),
          reason,
          barberId: targetBarberId,
        }),
      });

      if (res.ok) {
        setReason('');
        setError('');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Erstellen.');
      }
    } catch (err) {
      setError('Netzwerkfehler.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/admin/blocked-times/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Löschen.');
      }
    } catch (err) {
      setError('Netzwerkfehler.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };

    if (startDate.getHours() === 0 && endDate.getHours() === 23) {
        return `Ganzer Tag: ${format(startDate, 'dd.MM.yyyy', { locale: de })}`;
    }
    
    return `${format(startDate, 'dd.MM.yyyy, HH:mm', { locale: de })} - ${format(endDate, 'HH:mm', { locale: de })} Uhr`;
  };

  return (
    <>
      {isLoading && <LoadingModal message="Verarbeite..." />}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Formular zum Erstellen */}
        <form onSubmit={handleCreateBlock} className="p-6 rounded-lg space-y-4" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-xl font-semibold mb-4">Neue Abwesenheit eintragen</h3>
          
          {/* Admin/Head: Barber-Auswahl */}
          {isAdminOrHead && (
            <div>
              <label htmlFor="barberSelect" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Für wen?
              </label>
              <select
                id="barberSelect"
                value={targetBarberId}
                onChange={(e) => setTargetBarberId(e.target.value)}
                className="w-full p-2 rounded border"
                style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
              >
                {allBarbers.map(barber => (
                  <option key={barber.id} value={barber.id}>{barber.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Datum */}
          <div>
            <label htmlFor="blockDate" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Datum
            </label>
            <input
              type="date"
              id="blockDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full p-2 rounded border"
              style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
            />
          </div>

          {/* Ganzer Tag Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isFullDay"
              checked={isFullDay}
              onChange={(e) => setIsFullDay(e.target.checked)}
              className="h-5 w-5 rounded text-gold-500 focus:ring-gold-500"
              style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
            />
            <label htmlFor="isFullDay" className="ml-3 text-lg font-medium">Ganzer Tag</label>
          </div>

          {/* Zeit-Auswahl (wenn nicht ganzer Tag) */}
          {!isFullDay && (
            <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="startTime" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Von
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endTime" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Bis
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2 rounded border"
                  style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>
          )}

          {/* Grund */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
              Grund (Optional)
            </label>
            <input
              type="text"
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z.B. Urlaub, Arzttermin"
              className="w-full p-2 rounded border"
              style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="text-right">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50 transition-colors"
            >
              Speichern
            </button>
          </div>
        </form>

        {/* Liste existierender Blöcke */}
        <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h3 className="text-xl font-semibold mb-4">Geplante Abwesenheiten</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {existingBlocks.length > 0 ? (
              existingBlocks.map(block => (
                <div 
                    key={block.id} 
                    className="p-3 rounded border flex justify-between items-center" 
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-3)' }}
                >
                  <div>
                    <p className="font-semibold">{formatDateRange(block.startTime, block.endTime)}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {block.reason}
                      {/* Zeige Barber-Namen, wenn Admin/Head auf die Liste schaut */}
                      {isAdminOrHead && ` (${block.barber.name})`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteBlock(block.id)}
                    className="text-red-500 hover:text-red-400 p-1"
                    title="Blockierung löschen"
                    disabled={isLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--color-text-muted)' }}>Keine Abwesenheiten geplant.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}