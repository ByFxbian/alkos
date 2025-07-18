import React from 'react';

interface ConfirmationEmailProps {
  customerName: string;
  serviceName: string;
  barberName: string;
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

export default function ConfirmationEmail({ customerName, serviceName, barberName, startTime, host }: ConfirmationEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', lineHeight: '1.6' }}>
      <h1 style={{ color: '#f59e0b' }}>Terminbestätigung</h1>
      <p>Hallo {customerName},</p>
      <p>dein Termin bei uns wurde erfolgreich gebucht. Hier sind die Details:</p>
      <div style={{ backgroundColor: '#1c1c1c', color: '#ffffff', padding: '15px', borderRadius: '8px', marginTop: '20px' }}>
        <p><strong>Art:</strong> {serviceName}</p>
        <p><strong>Bei:</strong> {barberName}</p>
        <p><strong>Wann:</strong> {formatDate(new Date(startTime))}</p>
      </div>
      <p style={{ marginTop: '20px' }}>
        Wir freuen uns auf deinen Besuch! Solltest du den Termin nicht wahrnehmen können, storniere ihn bitte rechtzeitig über dein Kundenkonto.
      </p>
      <p style={{ color: '#999', fontSize: '12px', marginTop: '30px' }}>
        {host}
      </p>
    </div>
  );
}