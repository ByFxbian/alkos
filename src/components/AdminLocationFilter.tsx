'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { setCookie, getCookie } from 'cookies-next';

type SimpleLocation = { id: string; name: string };

export default function AdminLocationFilter({ locations }: { locations: SimpleLocation[] }) {
    const router = useRouter();
    const [selected, setSelected] = useState('ALL');

    useEffect(() => {
        const saved = getCookie('admin_location_filter');
        if (saved) setSelected(saved as string);
    }, []);

    const handleChange = (val: string) => {
        setSelected(val);
        setCookie('admin_location_filter', val, { maxAge: 60 * 60 * 24 * 365 });
        router.refresh();
    };
    
    if (locations.length <= 1) return null;

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-bold uppercase hidden md:inline">Daten für:</span>
            <select 
                value={selected} 
                onChange={e => handleChange(e.target.value)} 
                className="bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold p-2 rounded-lg outline-none focus:border-gold-500"
            >
                <option value="ALL">Alle Standorte</option>
                {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                ))}
            </select>
        </div>
    );
}