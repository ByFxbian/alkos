import React from 'react';

interface CancellationEmailProps {
  customerName: string;
  serviceName: string;
  startTime: Date;
  host: string;
}

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' Uhr';
};

export default function CancellationEmail({ customerName, serviceName, startTime, host }: CancellationEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', lineHeight: '1.6' }}>
      <h1 style={{ color: '#f59e0b' }}>Termin storniert</h1>
      <p>Hallo {customerName},</p>
      <p>dein folgender Termin wurde erfolgreich storniert:</p>
      <div style={{ backgroundColor: '#1c1c1c', color: '#ffffff', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <p><strong>Service:</strong> {serviceName}</p>
        <p><strong>Termin:</strong> {formatDate(new Date(startTime))}</p>
      </div>
      <p style={{ marginTop: '20px' }}>
        Schade, dass es nicht geklappt hat. Du kannst jederzeit einen neuen Termin über unsere Webseite buchen.
      </p>
      <p style={{ color: '#999', fontSize: '12px', marginTop: '30px' }}>
        {host}
      </p>
    </div>
  );
}