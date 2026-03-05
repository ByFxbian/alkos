'use client';

type HeatmapProps = {
  data: Record<string, number>; // key: "day-hour" e.g. "1-9" (Monday 9:00), value: count
  maxCount: number;
};

const dayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const dayOrder = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun (JS Sunday=0)
const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8:00 - 19:00

export default function BookingHeatmap({ data, maxCount }: HeatmapProps) {
  const getIntensity = (count: number) => {
    if (maxCount === 0 || count === 0) return 0;
    return Math.min(count / maxCount, 1);
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'var(--color-surface-2)';

    const alpha = 0.15 + intensity * 0.85;
    return `rgba(212, 175, 55, ${alpha})`;
  };

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-[480px]">
        
        <div className="grid grid-cols-[30px_repeat(12,1fr)] gap-0.5 md:gap-1 items-center">
          
          <div></div>
          {hours.map(h => (
            <div key={`header-${h}`} className="text-center text-[9px] md:text-[10px] text-[var(--color-text-muted)] font-medium mb-1">
              {h}
            </div>
          ))}


          {dayOrder.map((dayIdx, rowIdx) => {
            const cells = hours.map(h => {
              const key = `${dayIdx}-${h}`;
              const count = data[key] || 0;
              const intensity = getIntensity(count);
              return (
                <div
                  key={key}
                  className="aspect-square rounded-[2px] transition-all duration-200 group relative cursor-default"
                  style={{ backgroundColor: getColor(intensity) }}
                >

                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/90 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-max">
                    {dayLabels[rowIdx]} {h}:00 — {count} Termine
                  </div>
                </div>
              );
            });

            return [
              <div key={`label-${dayIdx}`} className="text-right text-[10px] md:text-xs text-[var(--color-text-muted)] font-medium pr-1">
                {dayLabels[rowIdx]}
              </div>,
              ...cells,
            ];
          })}
        </div>


        <div className="flex items-center justify-end gap-2 mt-4 text-[9px] md:text-[10px] text-[var(--color-text-muted)]">
          <span>Weniger</span>
          <div className="flex gap-0.5 md:gap-1">
            {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-[2px]"
                style={{ backgroundColor: getColor(intensity) }}
              />
            ))}
          </div>
          <span>Mehr</span>
        </div>

      </div>
    </div>
  );
}
