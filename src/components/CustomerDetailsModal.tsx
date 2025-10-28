'use client';

type CustomerData = {
    name: string | null;
    email: string;
    image: string | null;
    instagram: string | null;
    completedAppointments: number;
}

interface CustomerDetailsModalProps {
    customer: CustomerData | null;
    onClose: () => void;
}

export default function CustomerDetailsModal({customer, onClose}: CustomerDetailsModalProps) {
    if(!customer) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="p-6 rounded-lg max-w-sm w-full border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)'}}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">Kundendetails</h2>
                <div className="flex items-center mb-4">
                    <div>
                        <p className="font-semibold">{customer.name || 'N/A'}</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{customer.email}</p>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <p>
                        <strong>Instagram:</strong>{' '}
                        {customer.instagram ? (
                            <a
                                href={`https://instagram.com/${customer.instagram}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-500 hover:underline"
                            >
                                @{customer.instagram}
                            </a>
                        ) : (
                            'N/A'
                        )}
                    </p>
                    <p>
                        <strong>Stempel:</strong> {customer.completedAppointments} / 15
                    </p>
                </div>
                <div className="mt-6 text-right">
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-md text-sm font-semibold"
                    style={{ backgroundColor: 'var(--color-surface-3)'}}
                >
                    Schließen
                </button>
                </div>
            </div>
        </div>
    );
}