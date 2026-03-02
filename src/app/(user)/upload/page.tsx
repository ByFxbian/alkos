'use client';

import { useState } from 'react';
import { set } from 'zod';

export default function UploadPage() { 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        event.preventDefault();
        setMessage('Lade Bild hoch...');
        setError('');
        setImageUrl('');

        const file = event.target.files?.[0];
        if(!file) {
            setError('Keine Datei ausgewählt.');
            return;
        }

        try {
            const response = await fetch(`/api/avatar/upload?filename=${file.name}`,
                { method: 'POST', body: file},
            );

            if(response.ok) {
                const blob = await response.json();
                setMessage('Bild erfolgreich hochgeladen!');
                setImageUrl(blob.url);
            } else {
                setError('Fehler beim Hochladen des Bildes.');
            }
        } catch (e) {
            setError('Fehler beim Hochladen des Bildes.');
        }
    };

    return (
        <div className='container mx-auto py-20 px-4 text-center max-w-lg'>
            <h1 className='text-4xl font-bold mb-4'>Temporärer Bild-Upload</h1>
            <p style={{ color: 'var(--color-text-muted)'}} className='mb-6'>
                Lade hier die Bilder für die Team Seite hoch und kopiere die angezeigt URL.
            </p>

            <input type="file" 
                onChange={handleFileUpload}
                className='block w-full text-sm rounded-lg border cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:font-semibold'
                style={{
                    color: 'var(--color-text-muted)',
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                }}
            />

            {message && <p className="mt-4 text-green-500">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}

      {imageUrl && (
        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)' }}>
          <p className="font-bold">Kopiere diese URL:</p>
          <input 
            type="text" 
            readOnly 
            value={imageUrl} 
            className="w-full p-2 mt-2 rounded border"
            style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
            onFocus={(e) => e.target.select()}
          />
        </div>
      )}
    </div>
    );
}