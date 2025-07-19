'use client';

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useRouter } from "next/navigation";

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

    const handleCancel = async (appointmentId: string) => {
        if(confirm('Bist du sicher, dass du diesen Termin stornieren möchtest?')) {
            const res = await fetch(`/api/appointments/${appointmentId}`, {
                method: 'DELETE',
            });

            if(res.ok) {
                alert('Dein Termin wurde erfolgreich storniert.');
                router.refresh();
            } else {
                alert('Fehler bei der Stornierung.');
            }
        }
    };

    if (appointments.length === 0) {
        return <p className="text-neutral-400">Du hast keine anstehenden Termine.</p>
    }

    return (
        <div className="space-y-4">
            {appointments.map((app) => (
                <div key={app.id} className="bg-neutral-900 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">{app.service.name}</p>
                        <p className="text-neutral-300">bei {app.barber.name}</p>
                        <p className="text-gold-500 mt-1">
                            {format(new Date(app.startTime), 'EEEE, dd. MMMM yyyy \'um\' HH:mm \'Uhr\'', { locale: de })}
                        </p>
                    </div>
                    <button
                        onClick={() => handleCancel(app.id)}
                        className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-500 transition-colors"
                    >
                        Stornieren
                    </button>
                </div>
            ))}
        </div>
    );
}