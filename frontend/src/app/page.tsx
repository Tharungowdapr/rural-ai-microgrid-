'use client';

import dynamic from 'next/dynamic';
import { useGridStore } from '@/hooks/useGridStore';

const Topology = dynamic(() => import('@/components/Topology'), { ssr: false });

export default function DashboardPage() {
    const { villages, transfers, totalGeneration, totalDemand, gridStability } = useGridStore();

    const surplusCount = villages.filter(v => v.status === 'SURPLUS').length;
    const deficitCount = villages.filter(v => v.status === 'DEFICIT').length;
    const warningCount = villages.filter(v => v.status === 'WARNING').length;
    const balancedCount = villages.filter(v => v.status === 'BALANCED').length;

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-100">Network Dashboard</h2>
                <span className="text-xs text-zinc-500">Real-time topology view</span>
            </div>

            <div className="flex gap-3">
                {[
                    { label: 'Total Villages', value: villages.length, color: 'text-zinc-200' },
                    { label: 'Gen', value: `${(totalGeneration * 1000).toFixed(0)} kW`, color: 'text-emerald-400' },
                    { label: 'Load', value: `${(totalDemand * 1000).toFixed(0)} kW`, color: 'text-red-400' },
                    { label: 'Stability', value: `${gridStability.toFixed(1)}%`, color: gridStability > 95 ? 'text-emerald-400' : gridStability > 80 ? 'text-amber-400' : 'text-red-400' },
                    { label: 'Surplus', value: surplusCount, color: 'text-emerald-400' },
                    { label: 'Balanced', value: balancedCount, color: 'text-sky-400' },
                    { label: 'Warning', value: warningCount, color: 'text-amber-400' },
                    { label: 'Deficit', value: deficitCount, color: 'text-red-400' },
                    { label: 'Transfers', value: transfers.filter(t => t.status === 'ACTIVE').length, color: 'text-violet-400' },
                ].map(item => (
                    <div key={item.label} className="glass-card px-4 py-2.5 min-w-[100px]">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wide">{item.label}</p>
                        <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="flex-1 rounded-xl overflow-hidden border border-white/5">
                <Topology />
            </div>
        </div>
    );
}
