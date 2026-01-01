'use client';

import { useState, useEffect, useMemo } from 'react';
import { DayPicker } from 'react-day-picker';
import { addMinutes, format, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import type { User, Service } from '@/generated/prisma';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

import { FaGoogle, FaApple, FaCalendarAlt, FaUserTie } from 'react-icons/fa';
import Link from 'next/link';
import { createEvent, DateArray, EventAttributes } from 'ics';
import { motion } from 'framer-motion';

type BookingFormProps = {
  barbers: User[];
  services: Service[];
  hasFreeAppointment: boolean;
  currentLocationId: string;
};

type ConfirmedAppointmentData = {
    slot: string;
    service: Service;
    barber: User | { name: string; id: string };
};

function BookingProcessingModal() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className=" p-6 rounded-lg text-center border border-gold-500/20 shadow-2xl" style={{ backgroundColor: 'var(--color-surface)' }}>
        <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-semibold animate-pulse text-gold-500">Termin wird reserviert...</p>
      </div>
    </div>
  );
}

export default function BookingForm({ barbers, services, hasFreeAppointment, currentLocationId  }: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<User | { id: string, name: string } | null>(null);
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

  const [confirmedAppointment, setConfirmedAppointment] = useState<ConfirmedAppointmentData | null>(null);

  useEffect(() => {
    if (bookingSuccess) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  }, [bookingSuccess]);

  const getGoogleCalenderLink = () => {
    if (!confirmedAppointment) return '#';
    const { slot, service, barber } = confirmedAppointment;

    const start = new Date(slot);
    const end = addMinutes(start, service.duration);

    const title = encodeURIComponent(`Termin bei ALKOS (${service.name})`);
    const details = encodeURIComponent(`Barber: ${barber.name}\nService: ${service.name}`);
    const location = encodeURIComponent("Wiedner Gürtel 12, 1040 Wien");
    
    const formatTime = (date: Date) => date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatTime(start)}/${formatTime(end)}&details=${details}&location=${location}`;
  }

  const downloadIcsFile = () => {
    if (!confirmedAppointment) return;
    const { slot, service, barber } = confirmedAppointment;

    const start = new Date(slot);

    const startArray: DateArray = [
      start.getFullYear(),
      start.getMonth() + 1,
      start.getDate(),
      start.getHours(),
      start.getMinutes()
    ];

    const event: EventAttributes = {
      start: startArray,
      duration: { minutes: service.duration },
      title: `Termin bei ALKOS (${service.name})`,
      description: `Barber: ${barber.name}\nService: ${service.name}`,
      location: 'Wiedner Gürtel 12, 1040 Wien',
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      url: 'https://alkosbarber.at',
      organizer: { name: 'ALKOS Barber', email: 'contact@alkosbarber.at' },
    };

    createEvent(event, (error, value) => {
        if (error) {
            console.error(error);
            alert("Fehler beim Erstellen der Kalenderdatei.");
            return;
        }

        const blob = new Blob([value], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'termin_alkos.ics');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
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
    const bookingData = {
        serviceId: selectedService.id,
        barberId: selectedBarber.id,
        startTime: selectedSlot,
        useFreeAppointment: useFreeAppointment,
        locationId: currentLocationId
    };

    const confirmedData: ConfirmedAppointmentData = {
        slot: selectedSlot,
        service: selectedService,
        barber: selectedBarber
    };
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });

      if (res.ok) {
        setConfirmedAppointment(confirmedData);
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
        locationId: currentLocationId
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
  }, [selectedService, selectedBarber, selectedDate, currentLocationId]);

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


  if (bookingSuccess && confirmedAppointment) {
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
            <p className="font-bold text-lg mb-4">
                {format(new Date(confirmedAppointment.slot), "EEEE, dd. MMMM 'um' HH:mm", { locale: de })}
            </p>
            
            <p className="text-sm text-neutral-500 mb-1">Service & Barber</p>
            <p className="font-bold text-lg">
                {confirmedAppointment.service.name} bei {confirmedAppointment.barber.name}
            </p>
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
      <div className="container mx-auto py-8 px-4">
        
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-12">
             <div className="flex items-center justify-between mb-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                 <span className={step >= 1 ? 'text-gold-500' : ''}>Service</span>
                 <span className={step >= 2 ? 'text-gold-500' : ''}>Barber</span>
                 <span className={step >= 3 ? 'text-gold-500' : ''}>Zeit</span>
             </div>
             <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: '33%' }}
                    animate={{ width: `${step * 33.33}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="h-full bg-gold-500"
                 />
             </div>
        </div>

        <h1 className="text-4xl font-bold tracking-tight mb-8 text-center md:text-left">Termin buchen</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-gold-500">Service</h2>
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
                  className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedService?.id === service.id ? 'bg-gold-500 text-black border-gold-500 scale-105 shadow-xl' : 'border-[var(--color-border)] hover:border-gold-500 hover:bg-[var(--color-surface-2)]'}`}
                >
                  <div className="flex justify-between items-center">
                    <p className="font-bold">{service.name}</p>
                    <p className={`font-semibold ${useFreeAppointment && selectedService?.id === service.id ? 'line-through opacity-50' : ''}`}>
                      {service.price.toFixed(2)} €
                    </p>
                    {useFreeAppointment && selectedService?.id === service.id && (
                      <p className="font-semibold text-green-400">0.00 €</p>
                    )}
                  </div>
                  <p className="text-sm opacity-80">{service.duration} Minuten</p>
                  {service.name === 'Combo' && (
                    <p className="text-xs mt-1 opacity-60">
                      (Inkludiert: Haarschnitt & Bart)
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={`transition-opacity duration-500 ${step >= 2 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <h2 className="text-2xl font-semibold mb-4 text-gold-500">Barber</h2>
            <div className="space-y-2">
              
              {/* ANY BARBER BUTTON */}
              <button 
                onClick={() => { setSelectedBarber({ id: 'any', name: 'Beliebiger Barber' }); setSelectedDate(today); setStep(3); }} 
                disabled={step < 2} 
                className={`w-full text-left p-4 rounded-lg border transition-all duration-300 group ${selectedBarber?.id === 'any' ? 'bg-gold-500 text-black border-gold-500 scale-105 shadow-xl' : 'border-[var(--color-border)] hover:border-gold-500 hover:bg-[var(--color-surface-2)]'}`}
              >
                  <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedBarber?.id === 'any' ? 'bg-black/20' : 'bg-[var(--color-surface)]'}`}>
                         <FaUserTie className="w-5 h-5" />
                      </div>
                      <div>
                          <p className="font-bold">Egal / Beliebiger Barber</p>
                          <p className="text-xs opacity-70">Zeigt alle verfügbaren Termine an</p>
                      </div>
                  </div>
              </button>

              {barbers.map(barber => (
                <button key={barber.id} onClick={() => { setSelectedBarber(barber); setStep(3); }} disabled={step < 2} className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${selectedBarber?.id === barber.id ? 'bg-gold-500 text-black border-gold-500 scale-105 shadow-xl' : 'border-[var(--color-border)] hover:border-gold-500 hover:bg-[var(--color-surface-2)]'}`}>
                  <p className="font-bold">{barber.name}</p>
                </button>
              ))}
            </div>
          </div>

          <div className={`transition-opacity duration-500 ${step >= 3 ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
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
              className="flex justify-center bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)]"
              modifiersClassNames={{
                selected: 'bg-gold-500 text-black font-bold rounded-full'
              }}
              />
            <div className="mt-6">
              {isLoading && (
                  <div className="flex items-center justify-center py-8 text-gold-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current"></div>
                  </div>
              )}
              
              {!isLoading && selectedDate && availableSlots.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
                    {availableSlots.map(slot => (
                      <button 
                        key={slot} 
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 rounded-lg text-sm font-medium transition-all duration-200 ${selectedSlot === slot ? 'bg-green-500 text-white shadow-lg scale-105' : 'bg-[var(--color-surface-2)] hover:bg-gold-500 hover:text-black hover:scale-105'}`}
                      >
                        {format(new Date(slot), 'HH:mm')}
                      </button>
                    ))}
                  </div>

                  {hasFreeAppointment && (
                    <div className="mt-6 border-t border-[var(--color-border)] pt-6">
                      <label className="flex items-center space-x-3 cursor-pointer group">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${useFreeAppointment ? 'bg-gold-500 border-gold-500' : 'border-neutral-500 group-hover:border-gold-500'}`}>
                            {useFreeAppointment && <span className="text-black font-bold">✓</span>}
                        </div>
                        <input 
                          type="checkbox"
                          checked={useFreeAppointment}
                          onChange={(e) => setUseFreeAppointment(e.target.checked)}
                          className="hidden"
                        />
                        <span className="font-bold text-green-400 group-hover:text-green-300 transition-colors">Gratis-Termin einlösen</span>
                      </label>
                    </div>
                  )}

                  {selectedSlot && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 text-center">
                      <button onClick={handleBooking} disabled={isBooking} className="bg-gold-500 text-black font-bold px-8 py-4 rounded-xl hover:bg-gold-400 w-full disabled:bg-neutral-600 disabled:cursor-not-allowed shadow-lg shadow-gold-500/20 transform transition-transform active:scale-95">
                        {isBooking ? 'Bitte warten...' : `Termin bestätigen`}
                      </button>
                      <p className="mt-2 text-xs opacity-60">
                         {format(new Date(selectedSlot), 'HH:mm')} Uhr • {selectedService?.name} • {selectedBarber?.name}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
              {!isLoading && selectedDate && availableSlots.length === 0 && (
                <p className="text-center py-8 opacity-60">Für diesen Tag sind leider keine Termine mehr verfügbar.</p>
              )}
              {!isLoading && !selectedDate && step >= 3 && (
                  <p className="text-center py-8 opacity-60">Bitte wähle ein Datum aus.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
    );
}