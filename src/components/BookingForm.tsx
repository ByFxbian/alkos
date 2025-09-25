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
  hasFreeAppointment: boolean;
};


export default function BookingForm({ barbers, services, hasFreeAppointment  }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [useFreeAppointment, setUseFreeAppointment] = useState(false);

  const handleBooking = async () => {
    if (!selectedService || !selectedBarber || !selectedSlot) {
      alert("Bitte wähle alle Optionen aus.");
      return;
    }

    if (!session) {
      router.push('/login');
      return;
    }

    if (!session.user.emailVerified) {
      alert('Bitte bestätige zuerst deine E-Mail-Adresse, bevor du einen Termin buchst.');
      return;
    }

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
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gold-500">Art</h2>
          <div className="space-y-2">
            {services.map(service => (
              <button key={service.id} onClick={() => { setSelectedService(service); setStep(2); }} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedService?.id === service.id ? 'bg-gold-500 text-black border-gold-500' : 'border-neutral-700 hover:border-gold-500'}`}>
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
              <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} disabled={step < 2} className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${selectedBarber?.id === barber.id ? 'bg-gold-500 text-black border-gold-500' : 'border-neutral-700 hover:border-gold-500'}`}>
                <p className="font-bold">{barber.name}</p>
              </button>
            ))}
          </div>
        </div>

        <div className={step >= 3 ? '' : 'opacity-50'}>
          <h2 className="text-2xl font-semibold mb-4 text-gold-500">Datum & Uhrzeit</h2>
          <DayPicker mode="single" selected={selectedDate} onSelect={setSelectedDate} locale={de} fromDate={new Date()} disabled={step < 3} className="flex justify-center" />
          <div className="mt-4">
            {isLoading && <p>Lade freie Termine...</p>}
            {!isLoading && availableSlots.length > 0 && (
              <>

                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map(slot => (
                    <button 
                      key={slot} 
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg transition-colors ${selectedSlot === slot ? 'bg-green-500 text-white' : 'bg-neutral-800 hover:bg-gold-500 hover:text-black'}`}
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
                        className="h-5 w-5 rounded bg-neutral-700 border-neutral-600 text-gold-500 focus:ring-gold-500"
                      />
                      <span className="font-bold text-green-400">Gratis-Termin einlösen</span>
                    </label>
                  </div>
                )}

                {selectedSlot && (
                  <div className="mt-6 text-center">
                    <button onClick={handleBooking} className="bg-green-600 text-white font-bold px-8 py-3 rounded-full hover:bg-green-500 w-full">
                      Termin um {format(new Date(selectedSlot), 'HH:mm')} Uhr bestätigen
                    </button>
                  </div>
                )}
              </>
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