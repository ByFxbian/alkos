'use client';

import { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type BarberSimple = {
    id: string;
    name: string | null;
};

type RevenueChartProps = {
    barbers: BarberSimple[];
};

type ChartData = {
    name: string;
    value: number;
};

export default function RevenueChart({barbers}: RevenueChartProps) {
    const [range, setRange] = useState('7d');
    const [selectedBarber, setSelectedBarber] = useState('all');
    const [data, setData] = useState<ChartData[]>([]);
    const [total, setTotal] = useState(0);
    const [count, setCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams({
                    range,
                    barberId: selectedBarber,
                });
                const res = await fetch(`/api/admin/revenue?${params.toString()}`);
                const json = await res.json();

                if(res.ok) {
                    setData(json.chartData);
                    setTotal(json.totalRevenue);
                    setCount(json.appointmentCount);
                }
            } catch (error) {
                console.error("Failed to fetch revenue", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [range, selectedBarber]);

    return (
        <div className="p-6 rounded-lg border border-neutral-800 shadow-lg" style={{ backgroundColor: 'var(--color-surface)'}}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-bold">Umsatzentwicklung</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)'}}>
                        Gesamtumsatz im Zeitraum: <span className="text-gold-500 font-bold text-lg ml-1">{total.toFixed(2)} €</span>
                        <span className="mx-2">|</span>
                        {count} Termine
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <select 
                        value={selectedBarber}
                        onChange={(e) => setSelectedBarber(e.target.value)}
                        className="p-2 rounded text-sm flex-grow md:flex-grow-0"
                        style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                    >
                        <option value="all">Alle Barber</option>
                        {barbers.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <select
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        className="p-2 rounded text-sm border flex-grow md:flex-grow-0"
                        style={{ backgroundColor: 'var(--color-surface-3)', borderColor: 'var(--color-border)' }}
                    >
                        <option value="yesterday">Gestern</option>
                        <option value="7d">7 Tage</option>
                        <option value="30d">30 Tage</option>
                        <option value="3m">3 Monate</option>
                        <option value="6m">6 Monate</option>
                        <option value="12m">12 Monate</option>
                        <option value="all">Insgesamt</option>
                    </select>
                </div>
            </div>

            <div className="h-[300px] w-full relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-lg backdrop-blur-sm">
                        <p className="animate-pulse font-semibold">Lade Daten...</p>
                    </div>
                )}

                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{top:10, right: 10, left: -20, bottom: 0}}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
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
                    <div className="h-full flex items-center justify-center" style={{ color: 'var(--color-text-muted)' }}>
                        Keine Daten für diesen Zeitraum gefunden.
                    </div>
                )}
            </div>
        </div>
    )
}