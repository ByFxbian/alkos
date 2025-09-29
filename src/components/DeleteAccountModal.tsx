'use client';

import { useState } from 'react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isLoading: boolean;
  error: string;
}

export default function DeleteAccountModal({ isOpen, onClose, onConfirm, isLoading, error }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (password) {
      onConfirm(password);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className=" p-8 rounded-lg max-w-sm w-full border border-red-800" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h2 className="text-2xl font-bold text-red-500">Konto endgültig löschen?</h2>
        <p className="mt-2 mb-4" style={{ color: 'var(--color-text-muted)' }}>
          Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Termine und Daten werden dauerhaft entfernt.
        </p>
        <p className="mb-4">Bitte gib zur Bestätigung dein Passwort ein.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dein Passwort"
          className="w-full p-2 rounded border "
          style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)'}}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className=" hover:text-white" style={{ color: 'var(--color-text-muted)' }}>Abbrechen</button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !password}
            className="bg-red-600 text-white font-bold px-4 py-2 rounded-md hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Lösche...' : 'Konto löschen'}
          </button>
        </div>
      </div>
    </div>
  );
}