'use client';

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingModal from "./LoadingModal";

type AppointmentWithDetails = {
    id: string;
    startTime: Date;
    service: {
        name: string;
    };
    barber: {
        name: string | null;
    };
};

type AppointmentListProps = {
    appointments: AppointmentWithDetails[];
};

export default function AppointmentList({ appointments }: AppointmentListProps) {
    const router = useRouter();
    const [isCancelling, setIsCancelling] = useState<string | null>(null);

    const handleCancel = async (appointmentId: string) => {
        if(confirm('Bist du sicher, dass du diesen Termin stornieren möchtest?')) {
            setIsCancelling(appointmentId);
            try {
                const res = await fetch(`/api/appointments/${appointmentId}`, {
                    method: 'DELETE',
                });

                if(res.ok) {
                    alert('Dein Termin wurde erfolgreich storniert.');
                    router.refresh();
                } else {
                    const data = await res.json();
                    alert(`Fehler bei der Stornierung: ${data.error || 'Unbekannter Fehler'}`);
                }
            } catch (error) {
                console.error("Cancellation fetch error:", error);
                alert('Ein Netzwerkfehler ist aufgetreten. Bitte versuche es erneut.');
            } finally {
                setIsCancelling(null);
            }
            
        }
    };

    if (appointments.length === 0) {
        return <p style={{ color: 'var(--color-text-muted)' }}>Du hast keine anstehenden Termine.</p>
    }

    return (
        <>
            {isCancelling && <LoadingModal message="Termin wird storniert..." />}
            <div className="space-y-4">
                {appointments.map((app) => (
                    <div key={app.id} className=" p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: 'var(--color-surface)' }}>
                        <div>
                            <p className="font-bold text-lg">{app.service.name}</p>
                            <p style={{ color: 'var(--color-text-muted)' }}>bei {app.barber.name}</p>
                            <p className="text-gold-500 mt-1">
                                {format(new Date(app.startTime), 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })}
                            </p>
                        </div>
                        <button
                            onClick={() => handleCancel(app.id)}
                            disabled={isCancelling === app.id}
                            className={`bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-500 transition-colors ${isCancelling === app.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isCancelling === app.id ? 'Storniere...' : 'Stornieren'}
                        </button>
                    </div>
                ))}
            </div>
        </>
    );
}