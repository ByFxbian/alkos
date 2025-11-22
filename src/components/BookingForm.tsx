'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayPicker, getDefaultClassNames } from 'react-day-picker';
import { addMinutes, format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import type { User, Service } from '@/generated/prisma';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FaGoogle, FaApple, FaCalendarAlt } from 'react-icons/fa';
import Link from 'next/link';

type BookingFormProps = {
  barbers: User[];
  services: Service[];
  hasFreeAppointment: boolean;
};

function BookingProcessingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className=" p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p className="font-semibold animate-pulse">Termin wird gebucht...</p>
      </div>
    </div>
  );
}

export default function BookingForm({ barbers, services, hasFreeAppointment  }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const [useFreeAppointment, setUseFreeAppointment] = useState(false);

  const [isBooking, setIsBooking] = useState(false);
  const [showBookingProcessing, setShowBookingProcessing] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const getGoogleCalenderLink = () => {
    if(!selectedSlot || !selectedService || !selectedBarber) return '';
    const start = new Date(selectedSlot);
    const end = addMinutes(start, selectedService.duration);

    const title = encodeURIComponent(`Termin bei ALKOS (${selectedService.name})`);
    const details = encodeURIComponent(`Barber: ${selectedBarber.name}\nService: ${selectedService.name}`);
    const location = encodeURIComponent("Wiedner Gürtel 12, 1040 Wien");

    const formatTime = (date:Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatTime(start)}/${formatTime(end)}&details=${details}&location=${location}`;
  }

  const downloadIcsFile = () => {
    if (!selectedSlot || !selectedService || !selectedBarber) return;
    
    const start = new Date(selectedSlot);
    const end = addMinutes(start, selectedService.duration);

    const icsContent = `BEGIN:VCALENDAR
      VERSION:2.0
      PRODID:-//ALKOS Barber//Termin//DE
      BEGIN:VEVENT
      UID:${Date.now()}@alkosbarber.at
      DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d\d\d/g, "")}
      DTSTART:${start.toISOString().replace(/-|:|\.\d\d\d/g, "")}
      DTEND:${end.toISOString().replace(/-|:|\.\d\d\d/g, "")}
      SUMMARY:Termin bei ALKOS (${selectedService.name})
      DESCRIPTION:Barber: ${selectedBarber.name}\\nService: ${selectedService.name}
      LOCATION:Wiedner Gürtel 12, 1040 Wien
      END:VEVENT
      END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'termin_alkos.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    setShowBookingProcessing(true);
    try {
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
        setBookingSuccess(true);
        router.refresh();
        setSelectedService(null);
        setSelectedBarber(null);
        setSelectedDate(undefined);
        setSelectedSlot(null);
        setUseFreeAppointment(false);
        setStep(1);
      } else {
        const data = await res.json();
        alert(`Fehler bei der Buchung: ${data.error || 'Unbekannter Fehler'}`);
      }
    } catch (error) {
      console.error("Booking fetch error:", error);
      alert('Ein Netzwerkfehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsBooking(false);
      setShowBookingProcessing(false);
    }

  };

  useEffect(() => {
    if(step === 3 && !selectedDate) {
      setSelectedDate(today);
    }
  }, [step, selectedDate, today]);

  useEffect(() => {
    if(selectedService && selectedBarber && selectedDate) {
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
  }, [selectedService, selectedBarber, selectedDate]);

  useEffect(() => {
    if(!selectedService && services.length > 0 && barbers.length > 0) {
      const serviceId = searchParams.get('serviceId');
      const barberId = searchParams.get('barberId');

      if(serviceId && barberId) {
        const service = services.find(s => s.id === serviceId);
        const barber = barbers.find(b => b.id === barberId);

        if(service && barber) {
          setSelectedService(service);
          setSelectedBarber(barber);
          setStep(3);
        }
      }
    }
  }, [services, barbers, searchParams]);


  if (bookingSuccess) {
    return (
      <div className="container mx-auto py-20 px-4 text-center max-w-lg">
        <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <h1 className="text-4xl font-bold mb-2">Termin bestätigt!</h1>
        <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Dein Termin wurde erfolgreich gebucht. Wir haben dir eine Bestätigung per E-Mail gesendet.
        </p>

        <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-xl mb-8 text-left border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-500 mb-1">Datum & Uhrzeit</p>
            <p className="font-bold text-lg mb-4">{selectedSlot && format(new Date(selectedSlot), "EEEE, dd. MMMM 'um' HH:mm", { locale: de })}</p>
            
            <p className="text-sm text-neutral-500 mb-1">Service & Barber</p>
            <p className="font-bold text-lg">{selectedService?.name} bei {selectedBarber?.name}</p>
        </div>

        <div className="space-y-3">
            <p className="font-semibold mb-2">Termin zum Kalender hinzufügen:</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a 
                    href={getGoogleCalenderLink()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white py-3 px-6 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                    <FaGoogle className="text-blue-500" /> Google
                </a>
                <button 
                    onClick={downloadIcsFile}
                    className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white py-3 px-6 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                    <FaApple className="text-black dark:text-white" /> Apple
                </button>
                <button 
                    onClick={downloadIcsFile}
                    className="flex items-center justify-center gap-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-black dark:text-white py-3 px-6 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors font-medium"
                >
                    <FaCalendarAlt className="text-blue-700" /> Outlook
                </button>
            </div>
        </div>

        <div className="mt-12">
            <Link href="/meine-termine" className="text-gold-500 hover:underline">
                Zu meinen Terminen
            </Link>
        </div>
      </div>
    );
  }

    return (
    <>
      {showBookingProcessing && <BookingProcessingModal />}  
      <div className="container mx-auto py-12 px-4">
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
                    <p className={`font-semibold ${useFreeAppointment && selectedService?.id === service.id ? 'line-through text-gray-500' : ''}`}>
                      {service.price.toFixed(2)} €
                    </p>
                    {useFreeAppointment && selectedService?.id === service.id && (
                      <p className="font-semibold text-green-400">0.00 €</p>
                    )}
                  </div>
                  <p>{service.duration} Minuten</p>
                  {service.name === 'Combo' && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      (Inkludiert: Haarschnitt & Bart)
                    </p>
                  )}
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
              className="flex justify-center"
              />
            <div className="mt-4">
              {isLoading && <p>Lade freie Termine...</p>}
              {!isLoading && selectedDate && availableSlots.length > 0 && (
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
                        {isBooking ? 'Bitte warten...' : `Termin um ${format(new Date(selectedSlot), 'HH:mm')} Uhr ${useFreeAppointment ? ' (Gratis)' : ''} bestätigen`}
                      </button>
                    </div>
                  )}
                </>
              )}
              {!isLoading && selectedDate && availableSlots.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)' }}>Für diesen Tag sind leider keine Termine mehr verfügbar.</p>
              )}
              {!isLoading && !selectedDate && step >= 3 && (
                  <p style={{ color: 'var(--color-text-muted)' }}>Bitte wähle ein Datum aus.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
    );
}