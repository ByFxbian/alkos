'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';

interface Barber {
    id: string;
    name: string | null;
}

interface Location {
    id: string;
    name: string;
}

interface Service {
    id: string;
    name: string;
}

interface WalkInStampGeneratorProps {
    allBarbers: Barber[];
    availableLocations: Location[];
}

export default function WalkInStampGenerator({ allBarbers, availableLocations }: WalkInStampGeneratorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedBarberId, setSelectedBarberId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    
    const [services, setServices] = useState<Service[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Pre-populate selections
    useEffect(() => {
        if (allBarbers.length > 0) {
            setSelectedBarberId(allBarbers[0].id);
        }
        if (availableLocations.length > 0) {
            setSelectedLocationId(availableLocations[0].id);
        }
    }, [allBarbers, availableLocations]);

    // Fetch services on open
    useEffect(() => {
        if (isOpen) {
            fetchServices();
        }
    }, [isOpen]);

    const fetchServices = async () => {
        setIsLoadingServices(true);
        try {
            const res = await fetch('/api/admin/services');
            if (res.ok) {
                const data = await res.json();
                setServices(data);
                if (data.length > 0) {
                    setSelectedServiceId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading services:', error);
        } finally {
            setIsLoadingServices(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedBarberId || !selectedServiceId) {
            setErrorMessage('Bitte wähle einen Mitarbeiter und eine Dienstleistung aus.');
            return;
        }

        setIsGenerating(true);
        setErrorMessage('');
        setQrCodeDataUrl('');

        try {
            const res = await fetch('/api/admin/stamps/generate-walkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    barberId: selectedBarberId,
                    serviceId: selectedServiceId,
                    locationId: selectedLocationId || null
                })
            });

            if (res.ok) {
                const { token } = await res.json();
                const qrUrl = `${window.location.origin}/redeem-stamp?token=${token}`;
                QRCode.toDataURL(qrUrl, { width: 300, margin: 2 }, (err, url) => {
                    if (!err) {
                        setQrCodeDataUrl(url);
                    } else {
                        setErrorMessage('QR-Code Erstellung fehlgeschlagen.');
                    }
                });
            } else {
                const err = await res.json();
                setErrorMessage(err.error || 'Fehler beim Generieren.');
            }
        } catch (error) {
            console.error('Error generating stamp:', error);
            setErrorMessage('Verbindungsfehler.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setQrCodeDataUrl('');
        setErrorMessage('');
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[var(--color-gold-500)] text-black hover:brightness-110 rounded-xl transition-all shadow-md"
            >
                ⚡ Walk-In Stempel QR
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xl"
                        >
                            ✕
                        </button>

                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-[var(--color-text)]">Walk-In Stempel-QR erzeugen</h3>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Generiert einen zeitlich begrenzten QR-Code (10 Min. gültig) für Kunden ohne Online-Termin.
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm font-medium text-center">
                                {errorMessage}
                            </div>
                        )}

                        {!qrCodeDataUrl ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase block mb-1">Mitarbeiter</label>
                                    <select
                                        value={selectedBarberId}
                                        onChange={e => setSelectedBarberId(e.target.value)}
                                        className="w-full p-2.5 rounded-lg border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-gold-500"
                                    >
                                        <option value="" disabled>Wähle einen Barber...</option>
                                        {allBarbers.map(b => (
                                            <option key={b.id} value={b.id}>{b.name || 'Unbenannt'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase block mb-1">Dienstleistung</label>
                                    {isLoadingServices ? (
                                        <div className="text-xs text-[var(--color-text-muted)] animate-pulse">Lade Services...</div>
                                    ) : (
                                        <select
                                            value={selectedServiceId}
                                            onChange={e => setSelectedServiceId(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-gold-500"
                                        >
                                            <option value="" disabled>Wähle einen Service...</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {availableLocations.length > 1 && (
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-text-muted)] uppercase block mb-1">Standort</label>
                                        <select
                                            value={selectedLocationId}
                                            onChange={e => setSelectedLocationId(e.target.value)}
                                            className="w-full p-2.5 rounded-lg border bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-gold-500"
                                        >
                                            {availableLocations.map(l => (
                                                <option key={l.id} value={l.id}>{l.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <button
                                    onClick={handleGenerate}
                                    disabled={isGenerating || isLoadingServices}
                                    className="w-full bg-[var(--color-gold-500)] text-black font-bold py-3 rounded-lg hover:brightness-110 transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {isGenerating ? 'Generiere...' : 'QR-Code anzeigen'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-4">
                                <div className="p-4 bg-white rounded-xl shadow-inner border border-neutral-200">
                                    <Image src={qrCodeDataUrl} alt="Walk-In Stamp QR Code" width={250} height={250} className="w-full h-auto object-contain" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-bold text-green-500 animate-pulse">✓ QR-Code aktiv</p>
                                    <p className="text-[11px] text-[var(--color-text-muted)] mt-1">
                                        Der Kunde kann diesen Code jetzt mit seiner Kamera oder der Scan-Funktion einscannen.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setQrCodeDataUrl('')}
                                    className="px-4 py-2 bg-[var(--color-surface-2)] text-[var(--color-text)] rounded border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] text-xs font-bold transition-all"
                                >
                                    Zurück / Neu generieren
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
