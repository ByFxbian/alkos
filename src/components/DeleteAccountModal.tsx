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
      <div className="bg-neutral-900 p-8 rounded-lg max-w-sm w-full border border-red-800">
        <h2 className="text-2xl font-bold text-red-500">Konto endgültig löschen?</h2>
        <p className="text-neutral-400 mt-2 mb-4">
          Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Termine und Daten werden dauerhaft entfernt.
        </p>
        <p className="mb-4">Bitte gib zur Bestätigung dein Passwort ein.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Dein Passwort"
          className="w-full p-2 bg-neutral-800 rounded border border-neutral-700"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="mt-6 flex justify-end space-x-4">
          <button onClick={onClose} className="text-neutral-400 hover:text-white">Abbrechen</button>
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