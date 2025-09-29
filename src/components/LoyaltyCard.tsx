'use client';

interface LoyaltyCardProps {
  completedAppointments: number;
  hasFreeAppointment: boolean;
}

const STAMPS_NEEDED = 15;

export default function LoyaltyCard({ completedAppointments, hasFreeAppointment }: LoyaltyCardProps) {
  const stamps = Array.from({ length: STAMPS_NEEDED });

  if (hasFreeAppointment) {
    return (
      <div className="bg-green-800 border border-green-600 text-white p-6 rounded-lg text-center">
        <h2 className="text-2xl font-bold">🎉 Du hast einen Gratis-Termin! 🎉</h2>
        <p className="mt-2">Löse deinen Gutschein bei der nächsten Buchung ein.</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
      <h2 className="text-xl font-bold mb-4">Dein Stempelpass</h2>
      <div className="grid grid-cols-5 gap-3">
        {stamps.map((_, index) => (
          <div key={index} className={`w-full aspect-square rounded-full flex items-center justify-center
            ${index < completedAppointments 
              ? 'bg-gold-500' 
              : 'border-2'
            }`}
            style={{ 
              backgroundColor: index < completedAppointments ? 'var(--color-gold-500)' : 'var(--color-surface-3)',
              borderColor: 'var(--color-border)'
            }}
          >
            {index < completedAppointments && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-center mt-4 " style={{ color: 'var(--color-text-muted)' }}>{completedAppointments} von {STAMPS_NEEDED} Terminen abgeschlossen.</p>
    </div>
  );
}