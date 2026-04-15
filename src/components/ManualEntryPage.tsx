'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  locationId?: string | null;
}

interface LocationInfo {
  id: string;
  name: string;
  slug: string;
}

interface ManualEntry {
  id: string;
  serviceName: string;
  price: number;
  tip: number;
  duration: number | null;
  notes: string | null;
  date: string;
  location: { id: string; name: string };
  barber: { id: string; name: string; image: string | null };
  createdAt: string;
}

type Step = 'pin' | 'location' | 'form' | 'confirmation' | 'list';

export default function ManualEntryPage({ services }: { services: Service[] }) {
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [barberId, setBarberId] = useState<string | null>(null);
  const [barberName, setBarberName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);

  const [serviceName, setServiceName] = useState('');
  const [price, setPrice] = useState('');
  const [tip, setTip] = useState('');
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);


  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTips, setTotalTips] = useState(0);

  const [editingEntry, setEditingEntry] = useState<ManualEntry | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('manual_entry_session');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setBarberId(data.barberId);
        setBarberName(data.barberName);
        if (data.selectedLocation) {
          setSelectedLocation(data.selectedLocation);
          setDate(new Date().toISOString().split('T')[0]);
          setStep('form');
        } else if (data.locations?.length === 1) {
          setSelectedLocation(data.locations[0]);
          setDate(new Date().toISOString().split('T')[0]);
          setStep('form');
        } else {
          setStep('location');
        }
      } catch { /* ignore */ }
    }
  }, []);

  const fetchEntries = useCallback(async () => {
    if (!barberId) return;
    setIsLoadingEntries(true);
    try {
      const res = await fetch(`/api/manual-entry?barberId=${barberId}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setTotalRevenue(data.totalRevenue || 0);
        setTotalTips(data.totalTips || 0);
      }
    } catch { /* ignore */ } finally {
      setIsLoadingEntries(false);
    }
  }, [barberId]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setPinError(false);
    }
  };
  const handlePinDelete = () => { setPin(prev => prev.slice(0, -1)); setPinError(false); };
  const handlePinClear = () => { setPin(''); setPinError(false); };

  const verifyPin = async () => {
    if (pin.length < 4) { setPinError(true); return; }
    setIsVerifying(true);
    try {
      const res = await fetch('/api/manual-entry/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBarberId(data.barberId);
        setBarberName(data.barberName);
        const sessionData = {
          barberId: data.barberId,
          barberName: data.barberName,
          selectedLocation: null as LocationInfo | null,
        };
        if (data.locations.length > 0) {
          setSelectedLocation(data.locations[0]);
          sessionData.selectedLocation = data.locations[0];
          setDate(new Date().toISOString().split('T')[0]);
          setStep('form');
        } else {
          setPinError(true);
          setPin('');
          return;
        }
        sessionStorage.setItem('manual_entry_session', JSON.stringify(sessionData));
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



  const filteredServices = services
    .filter(s => !selectedLocation || !s.locationId || s.locationId === selectedLocation.id);

  const handleSubmit = async () => {
    if (!barberId || !selectedLocation) return;
    if (!serviceName.trim()) { setFormError('Service-Name erforderlich'); return; }
    if (!price || parseFloat(price) < 0) { setFormError('Gültiger Preis erforderlich'); return; }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const url = editingEntry ? `/api/manual-entry/${editingEntry.id}` : '/api/manual-entry';
      const method = editingEntry ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberId,
          locationId: selectedLocation.id,
          serviceName: serviceName.trim(),
          price: parseFloat(price),
          tip: tip ? parseFloat(tip) : 0,
          duration: duration ? parseInt(duration) : null,
          notes: notes.trim() || null,
          date,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStep('confirmation');
        setEditingEntry(null);
      } else {
        setFormError(data.error || 'Fehler beim Speichern');
      }
    } catch {
      setFormError('Netzwerkfehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setServiceName('');
    setPrice('');
    setTip('');
    setDuration('');
    setNotes('');
    setDate(new Date().toISOString().split('T')[0]);
    setFormError(null);
    setEditingEntry(null);
    setStep('form');
  };

  const startEdit = (entry: ManualEntry) => {
    setEditingEntry(entry);
    setServiceName(entry.serviceName);
    setPrice(entry.price.toString());
    setTip(entry.tip.toString());
    setDuration(entry.duration?.toString() || '');
    setNotes(entry.notes || '');
    setDate(entry.date.split('T')[0]);
    setStep('form');
  };

  const deleteEntry = async (entryId: string) => {
    if (!barberId) return;
    if (!confirm('Eintrag wirklich löschen?')) return;
    try {
      const res = await fetch(`/api/manual-entry/${entryId}?barberId=${barberId}`, { method: 'DELETE' });
      if (res.ok) {
        setEntries(prev => prev.filter(e => e.id !== entryId));
        await fetchEntries();
      }
    } catch { /* ignore */ }
  };

  const showList = async () => {
    await fetchEntries();
    setStep('list');
  };

  const logout = () => {
    sessionStorage.removeItem('manual_entry_session');
    setBarberId(null);
    setBarberName('');
    setSelectedLocation(null);
    setEntries([]);
    setDate(new Date().toISOString().split('T')[0]);
    setPin('');
    setStep('pin');
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
                ALKOS Einträge
              </h1>
              <p className="text-neutral-400">Bitte deinen persönlichen PIN eingeben</p>
            </div>

            <motion.div
              animate={pinError ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="flex justify-center gap-3 mb-8"
            >
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    i < pin.length
                      ? pinError ? 'bg-red-500' : 'bg-[var(--color-gold-500)]'
                      : 'bg-neutral-700'
                  }`}
                />
              ))}
              {pin.length > 4 && [...Array(Math.min(pin.length - 4, 2))].map((_, i) => (
                <div key={`extra-${i}`} className="w-4 h-4 rounded-full bg-[var(--color-gold-500)] transition-all duration-200" />
              ))}
            </motion.div>

            {pinError && <p className="text-red-500 text-center mb-4 text-sm">Falscher PIN</p>}

            <div className="grid grid-cols-3 gap-3 mb-6">
              {digits.map((digit, i) => (
                <div key={i}>
                  {digit !== '' ? (
                    <button
                      onClick={() => handlePinInput(digit)}
                      className="w-full aspect-square rounded-2xl text-2xl font-bold bg-neutral-800 hover:bg-neutral-700 active:scale-95 transition-all text-white"
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
              className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-black"
              style={{ backgroundColor: 'var(--color-gold-500)' }}
            >
              {isVerifying ? 'Prüfe...' : 'Bestätigen'}
            </button>
          </motion.div>
        )}



        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-lg"
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-gold-500)' }}>
                {editingEntry ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
              </h1>
              <p className="text-neutral-400 text-sm">
                {barberName} • {selectedLocation?.name}
              </p>
            </div>

            {formError && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-xl mb-4 text-center text-sm">
                {formError}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="mb-6">
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Service *</label>
                <div className="grid grid-cols-2 gap-3">
                  {filteredServices.map(service => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setServiceName(service.name);
                        setPrice(service.price.toString());
                        if (service.duration) setDuration(service.duration.toString());
                      }}
                      className={`p-4 rounded-xl text-left transition-all ${
                        serviceName === service.name
                          ? 'bg-[var(--color-gold-500)] text-black font-bold shadow-lg shadow-gold-500/20 scale-100 border-2 border-transparent'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-white border-2 border-transparent hover:border-neutral-600'
                      }`}
                    >
                      <p className="font-bold mb-1 leading-tight">{service.name}</p>
                      <p className={`text-xs ${serviceName === service.name ? 'text-black/70' : 'text-neutral-400'}`}>
                        {service.duration} Min • {service.price}€
                      </p>
                    </button>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      setServiceName('Produkt Verkauf');
                      setPrice('15');
                      setDuration('');
                    }}
                    className={`p-4 rounded-xl text-left transition-all ${
                      serviceName === 'Produkt Verkauf'
                        ? 'bg-[var(--color-gold-500)] text-black font-bold shadow-lg shadow-gold-500/20 scale-100 border-2 border-transparent'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-white border-2 border-transparent hover:border-neutral-600'
                    }`}
                  >
                    <p className="font-bold mb-1 leading-tight flex items-center gap-2">
                      <span>🛍️</span> Produkt (Wachs/Puder)
                    </p>
                    <p className={`text-xs ${serviceName === 'Produkt Verkauf' ? 'text-black/70' : 'text-neutral-400'}`}>
                      15€
                    </p>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Preis (€) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-[var(--color-gold-500)] focus:outline-none transition-all text-white placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Trinkgeld (€)</label>
                  <input
                    type="number"
                    value={tip}
                    onChange={e => setTip(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-[var(--color-gold-500)] focus:outline-none transition-all text-white placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Dauer (Min)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    placeholder="z.B. 30"
                    min="0"
                    className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-[var(--color-gold-500)] focus:outline-none transition-all text-white placeholder:text-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Datum</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-[var(--color-gold-500)] focus:outline-none transition-all text-white [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Notizen</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optionale Zusatzinfos..."
                  rows={2}
                  className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 focus:border-[var(--color-gold-500)] focus:outline-none transition-all text-white placeholder:text-neutral-600 resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !serviceName.trim() || !price}
              className="w-full py-4 rounded-xl font-bold text-lg text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              style={{ backgroundColor: 'var(--color-gold-500)' }}
            >
              {isSubmitting ? 'Speichern...' : editingEntry ? 'Aktualisieren' : 'Eintrag speichern'}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={showList}
                className="py-3 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-all text-sm"
              >
                📋 Meine Einträge
              </button>
              <button
                onClick={logout}
                className="py-3 rounded-xl font-bold bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-all text-sm"
              >
                🔒 Abmelden
              </button>
            </div>
          </motion.div>
        )}

        {step === 'confirmation' && (
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

            <h1 className="text-3xl font-bold mb-2 text-green-400">Gespeichert!</h1>
            <p className="text-neutral-400 mb-8">Dein Eintrag wurde erfolgreich gespeichert.</p>

            <div className="bg-neutral-800 rounded-2xl p-6 mb-8 text-left space-y-3">
              <div>
                <p className="text-sm text-neutral-400">Service</p>
                <p className="text-xl font-bold text-white">{serviceName}</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <p className="text-sm text-neutral-400">Preis</p>
                  <p className="text-xl font-bold text-white">{parseFloat(price).toFixed(2)} €</p>
                </div>
                {tip && parseFloat(tip) > 0 && (
                  <div>
                    <p className="text-sm text-neutral-400">Trinkgeld</p>
                    <p className="text-xl font-bold text-green-400">{parseFloat(tip).toFixed(2)} €</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-neutral-400">Datum</p>
                <p className="text-lg font-bold text-white">
                  {format(new Date(date + 'T12:00:00'), 'dd. MMMM yyyy', { locale: de })}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={logout}
                className="py-5 rounded-xl font-bold text-lg text-black transition-all"
                style={{ backgroundColor: 'var(--color-gold-500)' }}
              >
                Abmelden & Weiterer Eintrag
              </button>
            </div>
          </motion.div>
        )}

        {step === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl"
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-gold-500)' }}>
                Meine Einträge
              </h1>
              <p className="text-neutral-400 text-sm">{barberName}</p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{entries.length}</p>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Einträge</p>
              </div>
              <div className="bg-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold" style={{ color: 'var(--color-gold-500)' }}>{totalRevenue.toFixed(0)}€</p>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Umsatz</p>
              </div>
              <div className="bg-neutral-800 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{totalTips.toFixed(0)}€</p>
                <p className="text-xs text-neutral-400 uppercase tracking-wider">Trinkgeld</p>
              </div>
            </div>

            {isLoadingEntries ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--color-gold-500)] border-t-transparent mx-auto mb-4" />
                <p className="text-neutral-400">Lade Einträge...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-12 bg-neutral-800/50 rounded-xl">
                <p className="text-neutral-500 text-lg">Noch keine Einträge vorhanden</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar mb-6">
                {entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-neutral-800 rounded-xl p-4 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{entry.serviceName}</p>
                        <p className="text-xs text-neutral-500">
                          {format(new Date(entry.date), 'dd.MM.yyyy', { locale: de })}
                          {entry.duration && ` • ${entry.duration} Min`}
                          {' • '}{entry.location.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg" style={{ color: 'var(--color-gold-500)' }}>{entry.price.toFixed(2)}€</p>
                        {entry.tip > 0 && <p className="text-xs text-green-400">+{entry.tip.toFixed(2)}€ Tip</p>}
                      </div>
                    </div>
                    {entry.notes && (
                      <p className="text-xs text-neutral-500 italic mb-2">💬 {entry.notes}</p>
                    )}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-xs px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                    <div className="flex gap-2 mt-2 md:hidden">
                      <button
                        onClick={() => startEdit(entry)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-300 transition-colors"
                      >
                        ✏️ Bearbeiten
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 transition-colors"
                      >
                        🗑️ Löschen
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={resetForm}
                className="py-4 rounded-xl font-bold text-lg text-black transition-all"
                style={{ backgroundColor: 'var(--color-gold-500)' }}
              >
                + Neuer Eintrag
              </button>
              <button
                onClick={logout}
                className="py-4 rounded-xl font-bold text-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 transition-all"
              >
                🔒 Abmelden
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
