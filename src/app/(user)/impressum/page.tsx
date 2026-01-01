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
          Tel: +43 660 2231353<br />
          E-Mail: contact@alkosbarber.at<br />
          Instagram: alkosbarber
        </p>
        <p>Zuständigkeit Webauftritt:</p>
        <p>
          Fabian Sopa<br />
          Tel: +43 664 2584080<br />
          E-Mail: sopa.fabian@gmx.net<br />
          Instagram: fabian.s2702<br />
        </p>
      </div>
    </div>
  );
}