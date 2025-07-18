'use client';
'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import type { User, Service } from '@/generated/prisma';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type BookingFormProps = {
  barbers: User[];
  services: Service[];
};


export default function BookingForm({ barbers, services }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot) {
      alert("Bitte wähle alle Optionen aus.");
      return;
    }

    if (!session) {
      router.push('/login'); // Nicht eingeloggt? -> zum Login
      return;
    }

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startTime: selectedSlot,
      }),
    });

    if (res.ok) {
      alert('Dein Termin wurde erfolgreich gebucht!');
      // Optional: Seite neu laden oder zu einer "Meine Termine"-Seite weiterleiten
      window.location.reload(); 
    } else {
      alert('Fehler bei der Buchung.');
    }
  };

  useEffect(() => {
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
        })
        .finally(() => setIsLoading(false));
    }
  }, [selectedService, selectedBarber, selectedDate]);

  const css = `
    .rdp {
      --rdp-cell-size: 45px;
      --rdp-caption-font-size: 1.25rem;
      --rdp-background-color: #1c1c1c;
      --rdp-accent-color: #f59e0b;
      --rdp-color: #ffffff;
      margin: 1em 0;
      border: 1px solid #333;
      border-radius: 8px;
    }
    .rdp-head_cell { color: #a1a1aa; }
    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #333; }
  `;

    return (
    <div className="container mx-auto py-12 px-4">
      <style>{css}</style>
      <h1 className="text-4xl font-bold tracking-tight mb-8">Termin buchen</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* SCHRITT 1: DIENSTLEISTUNG */}
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Art</h2>
          <div className="space-y-2">
            {services.map(service => (
              <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedService?.id === service.id ? 'bg-amber-400 text-black border-amber-400' : 'border-neutral-700 hover:border-amber-400'}`}>
                <p className="font-bold">{service.name}</p>
                <p>{service.duration} Minuten</p>
              </button>
            ))}
          </div>
        </div>

        {/* SCHRITT 2: FRISEUR */}
        <div className={step >= 2 ? '' : 'opacity-50'}>
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Barber</h2>
          <div className="space-y-2">
            {barbers.map(barber => (
              <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} disabled={step < 2} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedBarber?.id === barber.id ? 'bg-amber-400 text-black border-amber-400' : 'border-neutral-700 hover:border-amber-400'}`}>
                <p className="font-bold">{barber.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* SCHRITT 3: DATUM & UHRZEIT */}
        <div className={step >= 3 ? '' : 'opacity-50'}>
          <h2 className="text-2xl font-semibold mb-4 text-amber-400">Datum & Uhrzeit</h2>
          <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={de} fromDate={new Date()} disabled={step < 3} className="flex justify-center" />
          <div className="mt-4">
            {isLoading && <p>Lade freie Termine...</p>}
            {!isLoading && availableSlots.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {availableSlots.map(slot => (
                  <button 
                    key={slot} 
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 rounded-lg transition-colors ${selectedSlot === slot ? 'bg-green-500 text-white' : 'bg-neutral-800 hover:bg-amber-400 hover:text-black'}`}
                  >
                    {format(new Date(slot), 'HH:mm')}
                  </button>
                ))}
                {selectedSlot && (
                  <div className="mt-6 text-center lg:col-span-3">
                    <button onClick={handleBooking} className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-500">
                      Termin um {format(new Date(selectedSlot), 'HH:mm')} Uhr bestätigen
                    </button>
                  </div>
                )}
              </div>
            )}
            {!isLoading && availableSlots.length === 0 && selectedDate && (
              <p className="text-neutral-400">Für diesen Tag sind leider keine Termine mehr verfügbar.</p>
            )}
          </div>
        </div>
      </div>
    </div>
    );
}