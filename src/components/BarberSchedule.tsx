'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import QRCode from 'qrcode';

type FullAppointment = {
  id: string;
  startTime: Date;
  isFree: boolean;
  service: { name: string };
  customer: { name: string | null; email: string; imageUrl: string | null;};
  barber: { name: string | null };
};

type BarberScheduleProps = {
  appointments: FullAppointment[];
  isAdmin: boolean;
};

function QrCodeModal({ token, onClose }: { token: string; onClose: () => void }) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

    useState(() => {
        const qrUrl = `${window.location.origin}/redeem-stamp?token=${token}`;
        QRCode.toDataURL(qrUrl, { width: 300 }, (err, url) => {
            if(!err) setQrCodeDataUrl(url);
        });
    });

    return (
        <div className='fixed inset-0 bg-black/80 flex items-center justify-center z-50' onClick={onClose}>
            <div className='bg-white p-8 rounded-lg text-center' onClick={(e) => e.stopPropagation()}>
                <h3 className='text-2xl font-bold text-black mb-4'>Stempel für Kunde</h3>
                {qrCodeDataUrl ? (
                    <Image src={qrCodeDataUrl} alt="QR Code" width={300} height={300} />
                ) : (
                    <p className='text-black'>QR-Code wird generiert...</p>
                )}
                <p className='text-neutral-600 mt-4'>Kunde soll diese Code scannen, um einen Stempel zu erhalten.</p>
                <button onClick={onClose} className='mt-6 bg-neutral-800 text-white px-6 py-2 rounded-lg'>Schließen</button>
            </div>
        </div>
    )
}

export default function BarberSchedule({ appointments, isAdmin }: BarberScheduleProps) {
    const router = useRouter();
    const [showQrModal, setShowQrModal] = useState<string | null>(null);

    const generateQrCode = async (appointmentId: string) => {
        const res = await fetch('/api/admin/stamps/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ appointmentId }),
        });
        if(res.ok) {
            const { token } = await res.json();
            setShowQrModal(token);
        } else {
            alert('Fehler beim Generieren des QR-Codes.');
        }
    }

    const handleDelete = async (appointmentId: string) => {
        if (confirm('Bist du sicher, dass du diesen Termin endgültig löschen möchtest?')) {
            const res = await fetch(`/api/admin/appointments/${appointmentId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                router.refresh();
            } else {
                alert('Fehler beim Löschen des Termins.');
            }
        }
    };

    if (appointments.length === 0) {
        return <p className="text-neutral-400">Keine anstehenden Termine gefunden.</p>;
    }

    return (
        <>
            {showQrModal && <QrCodeModal token={showQrModal} onClose={() => setShowQrModal(null)} />}
            <div className="space-y-4">
                {appointments.map((app) => (
                    <div key={app.id} className="bg-neutral-900 p-4 rounded-lg border-l-4 items-center justify-between border-gold-500">
                        <div className="flex items-center space-x-4">
                            <Image
                            src={app.customer.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                            alt={app.customer.name || 'Kunde'}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                            />
                            <div>
                                <p className="font-bold text-lg">{app.service.name}</p>
                                {app.isFree && <span className="text-xs font-bold uppercase text-green-400 bg-green-950 px-2 py-1 rounded">Stempelpass</span>}
                                <p className="text-neutral-300">
                                    Kunde: {app.customer.name} ({app.customer.email})
                                </p>
                                {/* Zeige den Friseur nur an, wenn der Nutzer Admin ist */}
                                {isAdmin && (
                                    <p className="text-neutral-400 text-sm">
                                    Bei: {app.barber.name}
                                    </p>
                                )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                                <p className="font-semibold">
                                    {format(new Date(app.startTime), 'dd.MM.yyyy', { locale: de })}
                                </p>
                                <p className="text-lg">
                                    {format(new Date(app.startTime), 'HH:mm', { locale: de })} Uhr
                                </p>
                            </div>
                            {isAdmin && (
                                <>
                                    <button onClick={() => generateQrCode(app.id)} className='bg-gold-500 text-black font-semibold px-3 py-2 rounded-md text-sm hover:bg-gold-400'>
                                        QR-Code
                                    </button>
                                    <button onClick={() => handleDelete(app.id)} className="text-neutral-500 hover:text-red-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </>
                                
                            )}
                        </div>
                    </div>
                ))}
            </div>   
        </>
       
    );
}