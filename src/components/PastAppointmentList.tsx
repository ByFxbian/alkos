'use client';

import { useState } from 'react';
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useRouter } from "next/navigation";

type PastAppointment = {
    id: string;
    startTime: Date;
    service: {
        id: string;
        name: string;
    };
    barber: {
        id: string;
        name: string | null;
    };
};

type PastAppointmentListProps = {
    appointments: PastAppointment[];
};

export default function PastAppointmentList({ appointments }: PastAppointmentListProps) {
    const router = useRouter();
    const [visibleCount, setVisibleCount] = useState(10);

    if (appointments.length === 0) {
        return <p style={{ color: 'var(--color-text-muted)' }}>Du hast noch keine vergangenen Termine.</p>
    }

    const handleRebook = (serviceId: string, barberId: string) => {
        router.push(`/termine?serviceId=${serviceId}&barberId=${barberId}`);
    };

    const displayedAppointments = appointments.slice(0, visibleCount);
    const hasMore = appointments.length > visibleCount;

    return (
        <div className="space-y-4">
            {displayedAppointments.map((app) => (
                <div key={app.id} className=" p-4 rounded-lg opacity-70" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div className="flex justify-between items-start gap-4">
                        <div>
                             <p className="font-bold text-lg">{app.service.name}</p>
                            <p style={{ color: 'var(--color-text-muted)' }}>bei {app.barber.name}</p>
                            <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
                                {format(new Date(app.startTime), 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })}
                            </p>
                        </div>

                        <div className="flex-shrink-0">
                            <button
                                onClick={() => handleRebook(app.service.id, app.barber.id)}
                                className="bg-gold-500 text-black font-semibold px-4 py-2 rounded-md hover:bg-gold-400 transition-colors text-sm"
                            >
                                Erneut buchen
                            </button>
                        </div>
                    </div>
                </div>
            ))}

            {hasMore && (
                <div className="text-center pt-4">
                    <button
                        onClick={() => setVisibleCount((prev) => prev + 10)}
                        className="px-6 py-2 rounded-lg text-gold-500 font-semibold border border-gold-500/30 hover:border-gold-500 hover:bg-gold-500/10 transition-all duration-300"
                    >
                        Mehr anzeigen ({appointments.length - visibleCount} weitere)
                    </button>
                </div>
            )}
        </div>
    );
}