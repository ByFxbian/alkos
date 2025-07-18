'use client';

import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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

export default function BarberSchedule({ appointments, isAdmin }: BarberScheduleProps) {
    const router = useRouter();

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
        <div className="space-y-4">
            {appointments.map((app) => (
                <div key={app.id} className="bg-neutral-900 p-4 rounded-lg border-l-4 items-center justify-between border-amber-500">
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
                            <button onClick={() => handleDelete(app.id)} className="text-neutral-500 hover:text-red-500 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}