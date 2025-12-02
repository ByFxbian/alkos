'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/generated/prisma';
import LoadingModal from './LoadingModal';

type ServiceManagementProps = {
  services: Service[];
};

const emptyForm = {
  id: null,
  name: '',
  duration: 30,
  price: 45,
};

export default function ServiceManagement({ services }: ServiceManagementProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<{
    id: string | null;
    name: string;
    duration: number | string; // Erlaube String für leere Eingabe
    price: number | string;    // Erlaube String für leere Eingabe
  }>(emptyForm);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = formData.id !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'duration' || name === 'price') ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleSelectForEdit = (service: Service) => {
    setFormData(service);
    window.scrollTo(0, 0); // Nach oben scrollen zum Formular
  };

  const clearForm = () => {
    setFormData(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? `/api/admin/services/${formData.id}` : '/api/admin/services';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          duration: Number(formData.duration),
          price: Number(formData.price),
        }),
      });

      if (res.ok) {
        clearForm();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Ein Fehler ist aufgetreten.');
      }
    } catch (err) {
      setError('Netzwerkfehler.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bist du sicher, dass du diesen Service löschen willst?')) {
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Fehler beim Löschen.');
      }
    } catch (err) {
      setError('Netzwerkfehler.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <LoadingModal message="Speichere..." />}

      <div className="p-6 rounded-lg mb-8" style={{ backgroundColor: 'var(--color-surface)' }}>
        <h3 className="text-xl font-semibold mb-4">{isEditing ? 'Service bearbeiten' : 'Neuen Service hinzufügen'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name (z.B. Haarschnitt)"
            required
            className="md:col-span-2 p-2 rounded border"
            style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
          />
          <input
            name="duration"
            type="number"
            value={formData.duration}
            onChange={handleChange}
            placeholder="Dauer (in Min.)"
            required
            className="p-2 rounded border"
            style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
          />
          <input
            name="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={handleChange}
            placeholder="Preis (z.B. 45.00)"
            required
            className="p-2 rounded border"
            style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
          />
          
          <div className="md:col-span-4 flex justify-end gap-4">
            {error && <p className="text-red-500 text-sm self-center">{error}</p>}
            {isEditing && (
              <button
                type="button"
                onClick={clearForm}
                className="px-4 py-2 rounded-md font-semibold"
                style={{ backgroundColor: 'var(--color-surface-3)'}}
              >
                Abbrechen
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="bg-gold-500 text-black font-bold px-6 py-2 rounded-md hover:bg-gold-400 disabled:opacity-50"
            >
              {isEditing ? 'Speichern' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--color-surface)' }}>
        <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
          <thead style={{ backgroundColor: 'var(--color-surface-3)'}}>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Dauer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Preis</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y " style={{ borderColor: 'var(--color-border)' }}>
            {services.map((service) => (
              <tr key={service.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{service.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{service.duration} Min.</td>
                <td className="px-6 py-4 whitespace-nowrap">{service.price.toFixed(2)} €</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button
                    onClick={() => handleSelectForEdit(service)}
                    className="text-gold-500 hover:text-gold-400"
                    disabled={isLoading}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-500 hover:text-red-400"
                    disabled={isLoading}
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}