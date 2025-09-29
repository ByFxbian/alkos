export default function ImpressumPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <h1 className="text-4xl font-bold mb-8">Impressum</h1>
      <div className="prose prose-invert max-w-none" style={{ color: 'var(--color-text-muted)' }}>
        <p>Angaben gemäß § 5 TMG:</p>
        <p>
          ALKOS (im folgenden: Verantwortlicher)<br />
          Geschäftsführer: Alen Mujic<br />
          Wiedner Gürtel 12<br />
          A-1040 Wien<br />
          Tel: +43 123 456 789<br />
          E-Mail: contact@alkosbarber.at<br />
          Instagram: alkosbarber
        </p>
      </div>
    </div>
  );
}