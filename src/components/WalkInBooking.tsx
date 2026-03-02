'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface WalkInBookingProps {
  services: Service[];
}

interface BookingResult {
  customerName: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  barberName: string;
}

interface BarberSlot {
  barberId: string;
  barberName: string;
  barberImage: string | null;
  slot: string;
  isEarliest: boolean;
}

type Step = 'pin' | 'name' | 'service' | 'slot-selection' | 'booking' | 'confirmation';

export default function WalkInBooking({ services }: WalkInBookingProps) {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pinLength, setPinLength] = useState(4);
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availableSlots, setAvailableSlots] = useState<BarberSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const unlocked = sessionStorage.getItem('walkin_unlocked');
      if (unlocked === 'true') {
        setStep('name');
      }
    }

    fetch('/api/walkin/info')
      .then(res => res.json())
      .then(data => {
        if (data.pinLength) {
          setPinLength(data.pinLength);
        }
      })
      .catch(console.error);
  }, []);

  const handlePinInput = (digit: string) => {
    if (pin.length < pinLength) {
      setPin(prev => prev + digit);
      setPinError(false);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setPin('');
    setPinError(false);
  };

  const verifyPin = async () => {
    if (pin.length < pinLength) {
      setPinError(true);
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch('/api/walkin/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        sessionStorage.setItem('walkin_unlocked', 'true');
        setStep('name');
        setPin('');
      } else {
        setPinError(true);
        setPin('');
      }
    } catch {
      setPinError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleServiceSelect = async (service: Service) => {
    setSelectedService(service);
    setIsLoadingSlots(true);
    setError(null);
    
    try {
      const res = await fetch(`/api/walkin/slots?serviceId=${service.id}`);
      const data = await res.json();
      
      if (res.ok && data.slots && data.slots.length > 0) {
        setAvailableSlots(data.slots);
        setStep('slot-selection');
      } else {
        setError(data.error || 'Momentan keine Termine frei.');
      }
    } catch {
      setError('Fehler beim Laden der Termine.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleBooking = async (barberId?: string, startTime?: string) => {
    if (!selectedService || !customerName.trim()) return;

    setIsBooking(true);
    setError(null);
    setStep('booking');

    try {
      const body: any = {
        customerName: customerName.trim(),
        serviceId: selectedService.id,
      };

      if (barberId && startTime) {
        body.barberId = barberId;
        body.startTime = startTime;
      }

      const res = await fetch('/api/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setBookingResult(data.appointment);
        setStep('confirmation');
      } else {
        setError(data.error || 'Buchung fehlgeschlagen');
        setStep('slot-selection');
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuche es erneut.');
      setStep('slot-selection');
    } finally {
      setIsBooking(false);
    }
  };

  const resetForNextCustomer = () => {
    setCustomerName('');
    setSelectedService(null);
    setAvailableSlots([]);
    setBookingResult(null);
    setError(null);
    setStep('name');
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {step === 'pin' && (
          <motion.div
            key="pin"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-gold-500)' }}>
                ALKOS Walk-In
              </h1>
              <p className="text-neutral-400">Bitte PIN eingeben</p>
            </div>

            <motion.div
              animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3 mb-8"
            >
              {[...Array(pinLength)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    i < pin.length
                      ? pinError
                        ? 'bg-red-500'
                        : 'bg-gold-500'
                      : 'bg-neutral-700'
                  }`}
                />
              ))}
            </motion.div>

            {pinError && (
              <p className="text-red-500 text-center mb-4 text-sm">Falscher PIN</p>
            )}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {digits.map((digit, i) => (
                <div key={i}>
                  {digit !== '' ? (
                    <button
                      onClick={() => handlePinInput(digit)}
                      className="w-full aspect-square rounded-2xl text-2xl font-bold bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all"
                    >
                      {digit}
                    </button>
                  ) : i === 9 ? (
                    <button
                      onClick={handlePinClear}
                      className="w-full aspect-square rounded-2xl text-sm font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-400 transition-all"
                    >
                      Löschen
                    </button>
                  ) : (
                    <button
                      onClick={handlePinDelete}
                      className="w-full aspect-square rounded-2xl text-xl font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-400 transition-all"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={verifyPin}
              disabled={pin.length < 4 || isVerifying}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-gold-500)', color: 'black' }}
            >
              {isVerifying ? 'Prüfe...' : 'Bestätigen'}
            </button>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-gold-500)' }}>
                Willkommen bei ALKOS
              </h1>
              <p className="text-neutral-400">Wie heißt du?</p>
            </div>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Dein Name"
              autoFocus
              className="w-full p-6 rounded-xl text-2xl text-center bg-neutral-800 border-2 border-neutral-700 focus:border-gold-500 focus:outline-none transition-all mb-6"
            />

            <button
              onClick={() => setStep('service')}
              disabled={customerName.trim().length < 2}
              className="w-full py-5 rounded-xl font-bold text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-gold-500)', color: 'black' }}
            >
              Weiter
            </button>
          </motion.div>
        )}

        {step === 'service' && (
          <motion.div
            key="service"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-gold-500)' }}>
                Hallo {customerName}!
              </h1>
              <p className="text-neutral-400">Was möchtest du machen lassen?</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-8">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  disabled={isLoadingSlots && selectedService?.id === service.id}
                  className={`p-6 rounded-xl text-left transition-all ${
                    selectedService?.id === service.id
                      ? 'bg-gold-500 text-black scale-105 shadow-xl'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                >
                  <p className="font-bold text-xl mb-1">{service.name}</p>
                  <p className={`text-sm ${selectedService?.id === service.id ? 'text-black/70' : 'text-neutral-400'}`}>
                    {service.duration} Min • {service.price}€
                  </p>
                  {isLoadingSlots && selectedService?.id === service.id && (
                    <div className="mt-2 text-sm animate-pulse">Lade Termine...</div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('name')}
                disabled={isLoadingSlots}
                className="flex-1 py-5 rounded-xl font-bold text-lg bg-neutral-800 hover:bg-neutral-700 transition-all"
              >
                Zurück
              </button>
            </div>
          </motion.div>
        )}

        {step === 'slot-selection' && (
          <motion.div
            key="slot-selection"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-4xl"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-gold-500)' }}>
                Wähle deinen Barber
              </h1>
              <p className="text-neutral-400">Wann möchtest du dran kommen?</p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <button
                  onClick={() => handleBooking()}
                  className="p-6 rounded-xl text-left transition-all bg-green-900/30 hover:bg-green-900/50 border border-green-500/50 group"
                >
                  <h3 className="text-xl font-bold text-green-400 mb-2">Schnellster Termin</h3>
                  <div className="text-4xl font-bold text-white mb-2">
                    {availableSlots[0] && format(new Date(availableSlots[0].slot), "HH:mm")}
                  </div>
                   <p className="text-sm text-green-300/70">Automatische Zuweisung</p>
                </button>

                {availableSlots.map(slot => (
                     <button
                     key={slot.barberId}
                     onClick={() => handleBooking(slot.barberId, slot.slot)}
                     className="p-6 rounded-xl text-left transition-all bg-neutral-800 hover:bg-neutral-700 flex flex-col"
                   >
                     <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-700">
                             {slot.barberImage ? (
                                 <Image 
                                    src={slot.barberImage} 
                                    alt={slot.barberName} 
                                    fill 
                                    className="object-cover"
                                 />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-xl font-bold text-neutral-400">
                                    {slot.barberName.charAt(0)}
                                </div>
                             )}
                        </div>
                        <div>
                             <p className="font-bold text-lg">{slot.barberName}</p>
                             {slot.isEarliest && <span className="text-xs text-green-400 bg-green-900/30 px-2 py-0.5 rounded">Frühester</span>}
                        </div>
                     </div>
                     
                     <div className="mt-auto">
                       <p className="text-3xl font-bold text-gold-500">
                         {format(new Date(slot.slot), "HH:mm")}
                       </p>
                       <p className="text-sm text-neutral-500">Uhr</p>
                     </div>
                   </button>
                ))}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('service')}
                className="flex-1 py-5 rounded-xl font-bold text-lg bg-neutral-800 hover:bg-neutral-700 transition-all"
              >
                Zurück
              </button>
            </div>
          </motion.div>
        )}

        {step === 'booking' && (
          <motion.div
            key="booking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-500 border-t-transparent mx-auto mb-6" />
            <p className="text-xl text-neutral-300">Termin wird gebucht...</p>
          </motion.div>
        )}

        {step === 'confirmation' && bookingResult && (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6"
            >
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>

            <h1 className="text-3xl font-bold mb-2 text-green-400">Termin gebucht!</h1>
            <p className="text-xl text-white mb-8">{bookingResult.customerName}</p>

            <div className="bg-neutral-800 rounded-2xl p-6 mb-8 text-left">
              <div className="mb-4">
                <p className="text-sm text-neutral-400">Service</p>
                <p className="text-xl font-bold">{bookingResult.serviceName}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-neutral-400">Barber</p>
                <p className="text-xl font-bold">{bookingResult.barberName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400">Uhrzeit</p>
                <p className="text-xl font-bold">
                  {format(new Date(bookingResult.startTime), "HH:mm 'Uhr'", { locale: de })}
                </p>
              </div>
            </div>

            <p className="text-neutral-400 mb-6">Du wirst aufgerufen, wenn du dran bist.</p>

            <button
              onClick={resetForNextCustomer}
              className="w-full py-5 rounded-xl font-bold text-xl transition-all"
              style={{ backgroundColor: 'var(--color-gold-500)', color: 'black' }}
            >
              Nächster Kunde
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
