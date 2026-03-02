'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/generated/prisma';
import LoadingModal from './LoadingModal';

type ServiceWithLocation = Service & {
  locationId: string | null;
  location: { name: string } | null;
};

type Location = { id: string; name: string };

type ServiceManagementProps = {
  services: ServiceWithLocation[];
  availableLocations: Location[];
  currentUserRole?: string;
};

const emptyForm = {
  id: null,
  name: '',
  duration: 30,
  price: 45,
  locationId: '',
};

export default function ServiceManagement({ services: initialServices, availableLocations }: ServiceManagementProps) {
  const router = useRouter();
  const [services, setServices] = useState<ServiceWithLocation[]>(initialServices);
  
  const [formData, setFormData] = useState<{
    id: string | null;
    name: string;
    duration: number | string;
    price: number | string;
    locationId: string;
  }>(emptyForm);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if(availableLocations.length > 0 && !formData.locationId && !formData.id) {
    }
  }, [availableLocations, formData.id, formData.locationId]);

  useEffect(() => {
    setServices(initialServices);
  }, [initialServices]);

  const isEditing = formData.id !== null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'duration' || name === 'price') ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleSelectForEdit = (service: Service) => {
    setFormData({
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        locationId: service.locationId || ''
    });
    window.scrollTo(0, 0);
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
          locationId: formData.locationId || null
        }),
      });

      if (res.ok) {
        router.refresh();
        setFormData({ ...emptyForm });
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
    <div className="bg-[var(--color-surface)] p-6 rounded-xl border border-[var(--color-border)]">
      {isLoading && <LoadingModal message="Speichere..." />}

      <h3 className="font-bold text-xl mb-6 text-[var(--color-text)]">{isEditing ? 'Service bearbeiten' : 'Neuen Service anlegen'}</h3>

      {error && <div className="bg-red-100 dark:bg-red-900/20 text-red-500 p-3 rounded mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 mb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold opacity-70 mb-1 text-[var(--color-text-muted)]">Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="z.B. Haarschnitt"
              required
              className="w-full p-3 rounded border bg-transparent border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold opacity-70 mb-1 text-[var(--color-text-muted)]">Standort</label>
          <select
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              className="w-full p-3 rounded border bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]"
          >
              <option value="">Global (Alle Standorte)</option>
              {availableLocations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold opacity-70 mb-1 text-[var(--color-text-muted)]">Dauer (Minuten)</label>
          <input
            type="number"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
            className="w-full p-3 rounded border bg-transparent border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]"
          />
        </div>
        <div>
          <label className="block text-xs font-bold opacity-70 mb-1 text-[var(--color-text-muted)]">Preis (€)</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full p-3 rounded border bg-transparent border-[var(--color-border)] text-[var(--color-text)] outline-none focus:border-[var(--color-gold-500)]"
          />
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[var(--color-gold-500)] text-black font-bold py-3 px-6 rounded hover:brightness-110 transition-all shadow-md"
          >
            {isEditing ? 'Änderungen speichern' : 'Erstellen'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                  setFormData({ ...emptyForm });
                  setError('');
              }}
              className="bg-[var(--color-surface-3)] text-[var(--color-text)] font-bold py-3 px-6 rounded hover:bg-[var(--color-border)] transition-colors border border-[var(--color-border)]"
            >
              Abbrechen
            </button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--color-border)]">
          <thead className="bg-[var(--color-surface-3)]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Standort</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Dauer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Preis</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {services.map((service) => (
              <tr key={service.id} className="hover:bg-[var(--color-surface-2)] transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-medium text-[var(--color-text)]">{service.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {service.location ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[var(--color-surface-3)] text-[var(--color-text)] border border-[var(--color-border)]">
                            {service.location.name}
                        </span>
                    ) : (
                        <span className="text-xs font-bold text-[var(--color-gold-500)] uppercase tracking-wider">Global</span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text-muted)]">{service.duration} Min.</td>
                <td className="px-6 py-4 whitespace-nowrap text-[var(--color-text)]">{service.price.toFixed(2)} €</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                  <button
                    onClick={() => handleSelectForEdit(service)}
                    className="text-[var(--color-gold-500)] hover:text-[var(--color-text)] transition-colors"
                    disabled={isLoading}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-red-500 hover:text-red-400 transition-colors"
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
    </div>
  );
}