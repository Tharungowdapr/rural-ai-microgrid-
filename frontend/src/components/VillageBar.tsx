// @ts-nocheck
'use client';

import { useGridStore } from '@/hooks/useGridStore';

const STATUS_COLORS: Record<string, string> = {
    SURPLUS: 'bg-emerald-500', BALANCED: 'bg-sky-500',
    WARNING: 'bg-amber-500', DEFICIT: 'bg-red-500',
};
const STATUS_BG: Record<string, string> = {
    SURPLUS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BALANCED: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DEFICIT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function VillageBar() {
    const { villages } = useGridStore();

    if (villages.length === 0) return null;

    return (
        <div className="flex gap-2 overflow-x-auto pb-1">
            {villages.map((v) => {
                const socColor = v.soc > 70 ? 'bg-emerald-500' : v.soc > 40 ? 'bg-amber-500' : 'bg-red-500';
                return (
                    <div key={v.id}
                        className="flex-none w-[200px] bg-zinc-900/90 border border-zinc-800 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-zinc-100">{v.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border ${STATUS_BG[v.status] || 'bg-zinc-700 text-zinc-300'}`}>
                                {v.status}
                            </span>
                        </div>

                        <div className="mb-1">
                            <div className="flex justify-between text-[9px] mb-0.5">
                                <span className="text-zinc-500">SOC</span>
                                <span className="text-zinc-300 font-mono">{v.soc.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                                <div className={`h-full ${socColor} transition-all duration-500`}
                                    style={{ width: `${v.soc}%` }} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[9px]">
                            <span className="text-zinc-500">Solar:</span>
                            <span className="text-emerald-400 font-mono text-right">{v.solarGeneration.toFixed(0)} kW</span>
                            <span className="text-zinc-500">Demand:</span>
                            <span className="text-red-400 font-mono text-right">{v.demand.toFixed(0)} kW</span>
                            <span className="text-zinc-500">Temp:</span>
                            <span className="text-amber-400 font-mono text-right">{Math.round(v.temperature)}°C</span>
                            <span className="text-zinc-500">Freq:</span>
                            <span className="text-cyan-400 font-mono text-right">{v.frequency.toFixed(1)} Hz</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
