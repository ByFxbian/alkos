'use client';

import { useState, useEffect } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import type { User, Service } from '@/generated/prisma';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type BookingFormProps = {
  barbers: User[];
  services: Service[];
  hasFreeAppointment: boolean;
};


export default function BookingForm({ barbers, services, hasFreeAppointment  }: BookingFormProps) {
  const defaultClassNames = getDefaultClassNames();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  //const startDate = new Date(2025, 9, 14); // October 14, 2025
  const today = startOfDay(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [useFreeAppointment, setUseFreeAppointment] = useState(false);

  const [isBooking, setIsBooking] = useState(false);

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot) {
      alert("Bitte wähle alle Optionen aus.");
      return;
    }

    if (!session) {
      router.push('/login');
      return;
    }

    setIsBooking(true);

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startTime: selectedSlot,
        useFreeAppointment: useFreeAppointment,
      }),
    });

    if (res.ok) {
      alert('Dein Termin wurde erfolgreich gebucht!');
      window.location.reload();
    } else {
      alert('Fehler bei der Buchung.');
    }

    setIsBooking(false);

  };

  useEffect(() => {
    if (!selectedDate && step >= 3) {
      setSelectedDate(today);
    }
  
    if (selectedService && selectedBarber && selectedDate) {
      setIsLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const query = new URLSearchParams({
        date: dateString,
        barberId: selectedBarber.id,
        serviceId: selectedService.id,
      }).toString();

      fetch(`/api/availability?${query}`)
        .then((res) => res.json())
        .then((slots) => {
          setAvailableSlots(slots);
          setSelectedSlot(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedService, selectedBarber, selectedDate]);

  const css = `
    .rdp {
      --rdp-cell-size: 45px;
      --rdp-caption-font-size: 1.25rem;
      --rdp-background-color: var(--color-surface-3);
      --rdp-accent-color: var(--color-gold-500); /* Basis-Akzentfarbe */
      --rdp-color: var(--color-text);
      margin: 1em 0;
      border: 1px solid var(--color-border);
      border-radius: 8px;
    }
    .rdp-head_cell {
      color: var(--color-text-muted);
      font-size: 0.8rem;
    }
    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
      background-color: var(--color-surface);
    }
    /* Ausgewählter Tag - WICHTIG */
    .rdp-day_selected,
    .rdp-day_selected:focus-visible,
    .rdp-day_selected:hover {
      background-color: var(--color-gold-500); /* Goldener Hintergrund */
      color: black !important; /* Schwarze Schriftfarbe, !important zur Sicherheit */
      border-radius: 50%;
      font-weight: bold;
      border: none; /* Sicherstellen, dass kein blauer Rand bleibt */
      outline: none; /* Sicherstellen, dass kein blauer Fokusring bleibt */
    }
     /* Heutiger Tag (nicht ausgewählt) */
    .rdp-day_today:not(.rdp-day_selected) {
       color: var(--color-gold-500);
       border: 1px solid var(--color-gold-500);
       border-radius: 50%;
       background-color: transparent; /* Sicherstellen, dass kein blauer Hintergrund bleibt */
    }
    /* Navigationspfeile - WICHTIG */
    .rdp-nav_button {
      color: var(--color-gold-500); /* Goldene Farbe */
      transition: background-color 0.2s ease;
      border-radius: 50%; /* Optional: Runde Buttons */
      border: none;
      outline: none;
    }
     .rdp-nav_button:not([disabled]):hover {
       background-color: var(--color-surface);
    }
     .rdp-nav_button:focus-visible {
         outline: 2px solid var(--color-gold-500); /* Fokus-Indikator */
         outline-offset: 2px;
     }
    /* Monats/Jahresanzeige */
    .rdp-caption_label {
       color: var(--color-text);
       font-weight: bold;
    }
    /* Deaktivierte Tage */
    .rdp-day_disabled {
       color: var(--color-text-muted);
       opacity: 0.4;
    }
     /* Ausgeblendete Tage */
    .rdp-day_hidden {
        visibility: hidden;
    }
  `;

    return (
    <div className="container mx-auto py-12 px-4">
      {/*<style>{css}</style>*/}
      <h1 className="text-4xl font-bold tracking-tight mb-8">Termin buchen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gold-500">Art</h2>
          <div className="space-y-2">
            {services.map(service => (
              <button key={service.id} 
                onClick={() => { 
                  setSelectedService(service); 
                  setSelectedBarber(null);
                  setSelectedSlot(null);
                  setSelectedDate(undefined);
                  setStep(2); 
                }} 
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedService?.id === service.id ? 'bg-gold-500 text-black border-gold-500' : ' hover:border-gold-500'}`} style={{ borderColor: selectedService?.id !== service.id ? 'var(--color-border)' : '' }}>
                <div className="flex justify-between items-center">
                  <p className="font-bold">{service.name}</p>
                  <p className="font-semibold">{service.price.toFixed(2)} €</p>
                </div>
                <p>{service.duration} Minuten</p>
              </button>
            ))}
          </div>
        </div>

        <div className={step >= 2 ? '' : 'opacity-50'}>
          <h2 className="text-2xl font-semibold mb-4 text-gold-500">Barber</h2>
          <div className="space-y-2">
            {barbers.map(barber => (
              <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} disabled={step < 2} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedBarber?.id === barber.id ? 'bg-gold-500 text-black border-gold-500' : ' hover:border-gold-500'}`} style={{ borderColor: selectedBarber?.id !== barber.id ? 'var(--color-border)' : '' }}>
                <p className="font-bold">{barber.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className={step >= 3 ? '' : 'opacity-50 pointer-events-none'}>
          <h2 className="text-2xl font-semibold mb-4 text-gold-500">Datum & Uhrzeit</h2>
          <DayPicker 
            mode="single" 
            selected={selectedDate} 
            onSelect={(date) => {
              setSelectedDate(date);
              setSelectedSlot(null);
            }} 
            locale={de} 
            hidden={[{ before: today }]} 
            //disabled={[{ before: today }]} 
            className="flex justify-center" 

            />
          <div className="mt-4">
            {isLoading && <p>Lade freie Termine...</p>}
            {!isLoading && availableSlots.length > 0 && (
              <>

                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button 
                      key={slot} 
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg transition-colors ${selectedSlot === slot ? 'bg-green-500 text-white' : 'hover:bg-gold-500 hover:text-black'}`}
                      style={{ backgroundColor: selectedSlot !== slot ? 'var(--color-surface)' : '' }}
                    >
                      {format(new Date(slot), 'HH:mm')}
                    </button>
                  ))}
                </div>

                {hasFreeAppointment && (
                  <div className="mt-6 border-t border-neutral-700 pt-6">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={useFreeAppointment}
                        onChange={(e) => setUseFreeAppointment(e.target.checked)}
                        className="h-5 w-5 rounded text-gold-500 focus:ring-gold-500"
                        style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
                      />
                      <span className="font-bold text-green-400">Gratis-Termin einlösen</span>
                    </label>
                  </div>
                )}

                {selectedSlot && (
                  <div className="mt-6 text-center">
                    <button onClick={handleBooking} disabled={isBooking} className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-500 w-full disabled:bg-neutral-600 disabled:cursor-not-allowed">
                      {isBooking ? 'Bitte warten...' : `Termin um ${format(new Date(selectedSlot), 'HH:mm')} Uhr bestätigen`}
                    </button>
                  </div>
                )}
              </>
            )}
            {!isLoading && availableSlots.length === 0 && selectedDate && (
              <p style={{ color: 'var(--color-text-muted)' }}>Für diesen Tag sind leider keine Termine mehr verfügbar.</p>
            )}
            {!isLoading && !selectedDate && step >= 3 && (
                <p style={{ color: 'var(--color-text-muted)' }}>Bitte wähle ein Datum aus.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    );
}