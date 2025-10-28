'use client';

interface LoadingModalProps {
  message?: string;
}

export default function LoadingModal({ message = 'Verarbeite...' }: LoadingModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div
        className="p-6 rounded-lg text-center shadow-xl"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        <p className="font-semibold animate-pulse">{message}</p>
      </div>
    </div>
  );
}