import React from 'react';

interface ReviewEmailProps {
  customerName: string;
  barberName: string;
  reviewLink: string;
}

export default function ReviewEmail({ customerName, barberName, reviewLink }: ReviewEmailProps) {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '20px', lineHeight: '1.6', color: '#333' }}>
      <h1 style={{ color: '#f59e0b' }}>Danke für deinen Besuch!</h1>
      <p>Hallo {customerName},</p>
      <p>wir hoffen, du bist zufrieden mit deinem Schnitt bei <strong>{barberName}</strong>.</p>
      
      <p>Es würde uns riesig helfen, wenn du uns eine kurze Bewertung auf Google da lässt. Das dauert keine Minute!</p>
      
      <div style={{ textAlign: 'center', margin: '30px 0' }}>
        <a 
          href={reviewLink} 
          target="_blank"
          style={{ 
            backgroundColor: '#f59e0b', 
            color: '#000', 
            padding: '12px 24px', 
            borderRadius: '50px', 
            textDecoration: 'none', 
            fontWeight: 'bold',
            fontSize: '16px'
          }}
        >
          Jetzt bewerten ⭐⭐⭐⭐⭐
        </a>
      </div>

      <p style={{ fontSize: '12px', color: '#999', marginTop: '40px' }}>
        Falls etwas nicht gepasst hat, antworte einfach auf diese Mail. Wir finden eine Lösung.
      </p>
    </div>
  );
}