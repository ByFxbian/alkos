'use client';

interface LoyaltyCardProps {
  completedAppointments: number;
  hasFreeAppointment: boolean;
}

const STAMPS_NEEDED = 15;

export default function LoyaltyCard({ completedAppointments, hasFreeAppointment }: LoyaltyCardProps) {
  const freeAppointmentsCount = Math.floor(completedAppointments / 15) + (hasFreeAppointment && completedAppointments < 15 ? 1 : 0);
  const currentStamps = completedAppointments % 15;

  const stamps = Array.from({ length: STAMPS_NEEDED });

  return (
    <div className="p-6 rounded-lg relative" style={{ backgroundColor: 'var(--color-surface)' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
        <h2 className="text-xl font-bold">Dein Stempelpass</h2>
        {freeAppointmentsCount > 0 && (
          <div className="bg-green-800 border border-green-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            {freeAppointmentsCount} Gratis-Termin{freeAppointmentsCount > 1 ? 'e' : ''} verfügbar!
          </div>
        )}
      </div>
      <div className="grid grid-cols-5 gap-3">
        {stamps.map((_, index) => (
          <div key={index} className={`w-full aspect-square rounded-full flex items-center justify-center
            ${index < currentStamps 
              ? 'bg-gold-500' 
              : 'border-2'
            }`}
            style={{ 
              backgroundColor: index < currentStamps ? 'var(--color-gold-500)' : 'var(--color-surface-3)',
              borderColor: 'var(--color-border)'
            }}
          >
            {index < currentStamps && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="text-center mt-6 " style={{ color: 'var(--color-text-muted)' }}>{currentStamps} von {STAMPS_NEEDED} Terminen bis zum nächsten Gratis-Termin.</p>
      
      {freeAppointmentsCount > 0 && (
         <p className="text-center mt-3 text-green-400 text-sm font-semibold">Löse deinen Gutschein bei der nächsten Buchung ein.</p>
      )}
    </div>
  );
}