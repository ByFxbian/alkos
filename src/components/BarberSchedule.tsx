'use client';

import { addDays, format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import CustomerDetailsModal from './CustomerDetailsModal';

type CustomerDataForSchedule = {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    instagram: string | null;
    completedAppointments: number;
}

type FullAppointment = {
  id: string;
  startTime: Date;
  isFree: boolean;
  service: { name: string };
  customer: CustomerDataForSchedule;
  barber: { name: string | null };
};

type BarberScheduleProps = {
  appointments: FullAppointment[];
  isAdmin: boolean;
};

function QrCodeModal({ token, onClose }: { token: string; onClose: () => void }) {
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [isRedeemed, setIsRedeemed] = useState(false);

    useEffect(() => {
        const qrUrl = `${window.location.origin}/redeem-stamp?token=${token}`;
        QRCode.toDataURL(qrUrl, { width: 300, margin: 2 }, (err, url) => {
        if (!err) setQrCodeDataUrl(url);
        });
    }, [token]);

    useEffect(() => {
        if (!token) return;

        const interval = setInterval(async () => {
        const res = await fetch(`/api/stamps/status/${token}`);
        if (res.ok) {
            const { isRedeemed } = await res.json();
            if (isRedeemed) {
            setIsRedeemed(true);
            clearInterval(interval);
            setTimeout(onClose, 2000);
            }
        }
        }, 2000); 

        return () => clearInterval(interval);
    }, [token, onClose]);

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white p-8 rounded-lg text-center flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-black mb-4">Stempel für Kunde</h3>
                
                {isRedeemed ? (
                    <div className="w-[300px] h-[300px] flex flex-col items-center justify-center bg-green-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-700 font-bold mt-4">Erfolgreich eingelöst!</p>
                    </div>
                ) : qrCodeDataUrl ? (
                    <Image src={qrCodeDataUrl} alt="QR Code" width={300} height={300} />
                ) : (
                    <div className="w-[300px] h-[300px] flex items-center justify-center">
                        <p className="text-black">QR-Code wird generiert...</p>
                    </div>
                )}

                <p className="text-neutral-600 mt-4 max-w-xs">Kunde soll diesen Code scannen, um einen Stempel zu erhalten.</p>
                <button onClick={onClose} className="mt-6 bg-neutral-800 text-white px-6 py-2 rounded-lg">Schließen</button>
            </div>
        </div>
    )
}

export default function BarberSchedule({ appointments, isAdmin }: BarberScheduleProps) {
    const router = useRouter();
    const [showQrModal, setShowQrModal] = useState<string | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerDataForSchedule | null>(null);

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

    const nextSevenDays = Array.from({ length: 7 }).map((_, i) => addDays(new Date(), i));

    if (appointments.length === 0) {
        return <p style={{ color: 'var(--color-text-muted)' }}>Für heute sind keine Termine eingetragen.</p>;
    }

    return (
        <>
            {showQrModal && <QrCodeModal token={showQrModal} onClose={() => setShowQrModal(null)} />}
            <CustomerDetailsModal
              customer={selectedCustomer}
              onClose={() => setSelectedCustomer(null)}
            />
            <Swiper navigation={true} modules={[Navigation]} className='mySwiper'>
                {nextSevenDays.map(day => {
                    const appointmentsForThisDay = appointments.filter(app => isSameDay(new Date(app.startTime), day));

                    return(
                        <SwiperSlide key={day.toString()}>
                            <h3 className='text-2xl font-bold text-center mb-4'>
                                {format(day, 'EEEE, dd. MMMM', { locale: de})}
                            </h3>
                            <div className="space-y-4 md:px-8 min-h-[200px]">
                                {appointmentsForThisDay.length > 0 ? (
                                    appointmentsForThisDay.map((app) => (
                                    <div key={app.id} className=" p-4 rounded-lg border-l-4 border-gold-500" style={{ backgroundColor: 'var(--color-surface)' }}>
                                        <div className='flex justify-between items-start gap-4'>
                                            <div className="flex items-center space-x-4 min-w-0 cursor-pointer" onClick={() => setSelectedCustomer(app.customer)}>
                                                <Image
                                                src={app.customer.image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                                                alt={app.customer.name || 'Kunde'}
                                                width={48}
                                                height={48}
                                                className="rounded-full object-cover flex-shrink-0 w-12 h-12"
                                                />
                                                <div className='min-w-0'>
                                                    <p className="font-bold text-lg truncate">{app.service.name}</p>
                                                    {app.isFree && <span className="text-xs font-bold uppercase text-green-400 bg-green-950 px-2 py-1 rounded truncate">Stempelpass</span>}
                                                    <p  className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                                                        Kunde: {app.customer.name}
                                                    </p>
                                                    {isAdmin && (
                                                        <p className="text-sm truncate" style={{ color: 'var(--color-text-muted)' }}>
                                                        Bei: {app.barber.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xl font-bold">
                                                    {format(new Date(app.startTime), 'HH:mm', { locale: de })} Uhr
                                                </p>
                                            </div>
                                        </div>
                                            {isAdmin && (
                                                <div className='flex justify-end items-center gap-4 mt-4 pt-4 border-t' style={{borderColor: 'var(--color-border)'}}>
                                                    <button onClick={() => generateQrCode(app.id)} className='bg-gold-500 text-black font-semibold px-3 py-2 rounded-md text-sm hover:bg-gold-400'>
                                                        QR-Code
                                                    </button>
                                                    <button onClick={() => handleDelete(app.id)} className="hover:text-red-500 transition-colors p-2 rounded-full" style={{ color: 'var(--color-text-muted)' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                
                                            )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10" style={{ color: 'var(--color-text-muted)' }}>
                                    Für diesen Tag sind keine Termine eingetragen.
                                </p>
                            )}
                            </div>   
                        </SwiperSlide>
                    );
                })}
            </Swiper>
        </>
       
    );
}