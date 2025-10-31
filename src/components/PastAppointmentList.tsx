'use client';

import { format } from "date-fns";
import { de } from "date-fns/locale";

type PastAppointment = {
    id: string;
    startTime: Date;
    service: {
        name: string;
    };
    barber: {
        name: string | null;
    };
};

type PastAppointmentListProps = {
    appointments: PastAppointment[];
};

export default function PastAppointmentList({ appointments }: PastAppointmentListProps) {
    if (appointments.length === 0) {
        return <p style={{ color: 'var(--color-text-muted)' }}>Du hast noch keine vergangenen Termine.</p>
    }

    return (
        <div className="space-y-4">
            {appointments.map((app) => (
                <div key={app.id} className=" p-4 rounded-lg opacity-70" style={{ backgroundColor: 'var(--color-surface)' }}>
                    <div>
                        <p className="font-bold text-lg">{app.service.name}</p>
                        <p style={{ color: 'var(--color-text-muted)' }}>bei {app.barber.name}</p>
                        <p className="mt-1" style={{ color: 'var(--color-text-muted)' }}>
                            {format(new Date(app.startTime), 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}