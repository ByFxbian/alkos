'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { de } from 'date-fns/locale';

type ChartData = {
    name: string;
    value: number;
};

type RevenueChartProps = {
    data: ChartData[];
    total: number;
    count: number;
    isLoading: boolean;
};

export default function RevenueChart({ data, total, count, isLoading }: RevenueChartProps) {
    return (
        <div className="p-6 rounded-lg shadow-lg border border-[var(--color-border)]" style={{ backgroundColor: 'var(--color-surface)' }}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold text-[var(--color-text)]">Umsatzentwicklung</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        Gesamtumsatz im Zeitraum: <span className="text-gold-500 font-bold text-lg ml-1">{total.toFixed(2)} €</span>
                        <span className="mx-2">|</span>
                        {count} Buchung(en)
                    </p>
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg backdrop-blur-sm">
                        <p className="animate-pulse font-semibold text-white">Lade Daten...</p>
                    </div>
                )}

                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke="#888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                stroke="#888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}€`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #333', borderRadius: '8px' }}
                                itemStyle={{ color: '#facc15' }}
                                formatter={(value: number) => [`${value.toFixed(2)} €`, 'Umsatz']}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#facc15"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorRevenue)"
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-[var(--color-text-muted)]">
                        Keine Daten für diesen Zeitraum gefunden.
                    </div>
                )}
            </div>
        </div>
    );
}