import React from 'react';

interface VerificationEmailProps {
  url: string;
  host: string;
}

export default function VerificationEmail({ url, host }: VerificationEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
      <h1 style={{ color: '#f59e0b' }}>Willkommen bei ALKOS!</h1>
      <p>Bitte klicke auf den folgenden Button, um deine E-Mail-Adresse zu bestätigen und dein Konto zu aktivieren.</p>
      <a 
        href={url} 
        target="_blank" 
        style={{
          display: 'inline-block',
          padding: '12px 24px',
          margin: '20px 0',
          backgroundColor: '#f59e0b',
          color: '#000000',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        Konto aktivieren
      </a>
      <p style={{ color: '#999', fontSize: '12px' }}>
        Wenn du dich nicht registriert hast, kannst du diese E-Mail ignorieren.
      </p>
      <p style={{ color: '#999', fontSize: '12px' }}>{host}</p>
    </div>
  );
}