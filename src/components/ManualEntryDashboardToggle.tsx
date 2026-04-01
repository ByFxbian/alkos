'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Props {
  manualRevenue7Days: number;
  manualTips7Days: number;
  manualCount7Days: number;
  manualRevenue30Days: number;
  manualCount30Days: number;
}

export default function ManualEntryDashboardToggle({
  manualRevenue7Days,
  manualTips7Days,
  manualCount7Days,
  manualRevenue30Days,
  manualCount30Days,
}: Props) {
  const router = useRouter();
  const [includeEnabled, setIncludeEnabled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const isIncluded = document.cookie.includes('include_manual_revenue=true');
    setIncludeEnabled(isIncluded);
  }, []);

  const toggleInclude = () => {
    const newState = !includeEnabled;
    setIncludeEnabled(newState);

    document.cookie = `include_manual_revenue=${newState}; path=/; max-age=31536000`;

    router.refresh();
  };

  if (!isMounted) return null;

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm transition-all hover:border-[var(--color-gold-500)]/30">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
            📝 Manuelle Einträge
          </h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-lg">
            Deine Barber haben {manualCount7Days} Termine ({manualRevenue7Days.toFixed(0)}€) in den letzten 7 Tagen manuell erfasst. (30 Tage: {manualCount30Days} Termine, {manualRevenue30Days.toFixed(0)}€)
          </p>
          {manualTips7Days > 0 && (
             <p className="text-xs text-green-500 mt-1 font-medium">+{manualTips7Days.toFixed(0)}€ Trinkgeld (7 Tage)</p>
          )}
        </div>

        <div className="flex items-center gap-3 bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)]">
          <span className="text-sm font-bold text-[var(--color-text-muted)]">Ins Dashboard aufnehmen?</span>
          
          <button
            onClick={toggleInclude}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-gold-500)] focus:ring-offset-2 focus:ring-offset-[var(--color-background)] ${
              includeEnabled ? 'bg-[var(--color-gold-500)]' : 'bg-neutral-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                includeEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

      </div>
    </div>
  );
}
