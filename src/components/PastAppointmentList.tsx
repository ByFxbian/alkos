'use client';

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

    if (appointments.length === 0) {
        return <p style={{ color: 'var(--color-text-muted)' }}>Du hast noch keine vergangenen Termine.</p>
    }

    const handleRebook = (serviceId: string, barberId: string) => {
        router.push(`/termine?serviceId=${serviceId}&barberId=${barberId}`);
    };

    return (
        <div className="space-y-4">
            {appointments.map((app) => (
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
        </div>
    );
}