/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { endOfDay, format, isSameDay, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import LoadingModal from './LoadingModal';
import { Role } from '@/generated/prisma';
import { DayPicker } from 'react-day-picker';

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

  const displayedBlocks = isAdminOrHead 
    ? existingBlocks.filter(b => (b.barber.name === allBarbers.find(u => u.id === targetBarberId)?.name) || targetBarberId === currentUserId && !b.barber.name )
    : existingBlocks;

  const getBlockForDay = (day: Date) => {
    return existingBlocks.find(block => {
        const start = new Date(block.startTime);
        const end = new Date(block.endTime);
        return day >= startOfDay(start) && day <= endOfDay(end);
    });
  };

  const handleDayClick = async (day: Date, modifiers: any) => {
    const existingBlock = modifiers.blocked ? getBlockForDay(day) : null;

    if (existingBlock) {
        if(!confirm(`Blockierung für ${format(day, 'dd.MM.yyyy')} löschen?`)) return;
        
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/blocked-times/${existingBlock.id}`, { method: 'DELETE' });
            if(res.ok) router.refresh();
        } catch(e) { alert("Fehler beim Löschen"); }
        setIsLoading(false);
    } else {
        const reason = prompt("Grund für Abwesenheit (optional):", "Urlaub");
        if (reason === null) return; 

        setIsLoading(true);
        try {
            const res = await fetch('/api/admin/blocked-times', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startTime: startOfDay(day).toISOString(),
                    endTime: endOfDay(day).toISOString(),
                    reason: reason || "Abwesend",
                    barberId: targetBarberId,
                }),
            });
            if(res.ok) router.refresh();
            else alert("Fehler beim Erstellen");
        } catch(e) { alert("Netzwerkfehler"); }
        setIsLoading(false);
    }
  };

  const modifiers = {
    blocked: (date: Date) => {
        return existingBlocks.some(block => {
            const isForSelectedBarber = isAdminOrHead 
                ? allBarbers.find(b => b.id === targetBarberId)?.name === block.barber.name
                : true;

            if(!isForSelectedBarber) return false;

            return date >= startOfDay(new Date(block.startTime)) && 
                   date <= endOfDay(new Date(block.endTime));
        });
    }
  };

  const modifiersStyles = {
    blocked: {
      color: 'white',
      backgroundColor: '#ef4444', // Red-500
      borderRadius: '50%',
      fontWeight: 'bold'
    }
  };

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
      {isLoading && <LoadingModal message="Aktualisiere Kalender..." />}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            
            {isAdminOrHead && (
                <div className="mb-6">
                    <label className="block text-sm font-bold mb-2">Kalender verwalten für:</label>
                    <select
                        value={targetBarberId}
                        onChange={(e) => setTargetBarberId(e.target.value)}
                        className="w-full p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950"
                    >
                        {allBarbers.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex justify-center">
                <DayPicker
                    mode="single"
                    onDayClick={handleDayClick}
                    modifiers={modifiers}
                    modifiersStyles={modifiersStyles}
                    locale={de}
                    disabled={{ before: new Date() }}
                    className="p-4 border rounded-lg bg-white dark:bg-black text-lg"
                />
            </div>
            <p className="text-center text-sm text-neutral-500 mt-4">
                Klicke auf einen Tag, um ihn rot zu markieren (blockieren) oder freizugeben.
            </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-xl mb-4">Aktuelle Blockierungen</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {existingBlocks
                    .filter(b => isAdminOrHead ? allBarbers.find(u => u.id === targetBarberId)?.name === b.barber.name : true)
                    .length === 0 && (
                        <p className="text-neutral-500 italic">Keine Einträge vorhanden.</p>
                    )
                }
                
                {existingBlocks
                    .filter(b => isAdminOrHead ? allBarbers.find(u => u.id === targetBarberId)?.name === b.barber.name : true)
                    .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                    .map(block => (
                    <div key={block.id} className="flex justify-between items-center p-3 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm">
                        <div>
                            <p className="font-bold text-sm">
                                {format(new Date(block.startTime), 'dd.MM.yyyy')}
                                { !isSameDay(new Date(block.startTime), new Date(block.endTime)) && 
                                    ` - ${format(new Date(block.endTime), 'dd.MM.yyyy')}`
                                }
                            </p>
                            <p className="text-xs text-neutral-500">
                                {format(new Date(block.startTime), 'HH:mm')} - {format(new Date(block.endTime), 'HH:mm')} Uhr
                            </p>
                            <p className="text-sm mt-1 text-gold-500">{block.reason}</p>
                        </div>
                        <button 
                            onClick={() => handleDayClick(new Date(block.startTime), {blocked: true})}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-full transition-colors"
                            title="Löschen"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </>
  );
}