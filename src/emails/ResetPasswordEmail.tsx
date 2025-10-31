
interface ResetPasswordEmailProps {
    url: string;
    host: string;
}

export default function ResetPasswordEmail({ url, host}: ResetPasswordEmailProps) {
    return (
        <div style={{ fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }}>
            <h1 style={{ color: '#f59e0b' }}>Passwort zurücksetzen</h1>
            <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts für ALKOS gesendet.</p>
            <p>Bitte klicke auf den folgenden Button, um ein neues Passwort festzulegen. Der Link ist 1 Stunde gültig.</p>
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
                Passwort zurücksetzen
            </a>
            <p style={{ color: '#999', fontSize: '12px' }}>
                Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.
            </p>
            <p style={{ color: '#999', fontSize: '12px' }}>{host}</p>
        </div>
    );
}