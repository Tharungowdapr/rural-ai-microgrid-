'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { Activity, Zap, TrendingUp, Play, Pause, Clock } from 'lucide-react';
import { useState } from 'react';

export default function TopBar() {
    const {
        villages, activeTransfers, totalGeneration, totalDemand,
        gridStability, simulationRunning, simulationHour,
    } = useGridStore();
    const [loading, setLoading] = useState(false);

    const handleToggle = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/simulation/toggle', { method: 'POST' });
            const data = await res.json();
            useGridStore.getState().setSimulationRunning(!data.paused);
        } catch {}
        setLoading(false);
    };

    const hour = simulationHour ?? 12;
    const timeStr = `${String(hour).padStart(2, '0')}:00`;

    return (
        <header className="h-14 glass-header flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-base font-bold tracking-tight text-zinc-100 leading-none">Rural Microgrid</h1>
                    <p className="text-[9px] text-zinc-500 mt-0.5">Decentralized Renewable Energy Network</p>
                </div>

                <div className="h-8 w-px bg-white/5" />

                <div className="flex items-center gap-5 text-[11px]">
                    <div className="flex items-center gap-1.5">
                        <span className="text-zinc-500">Villages</span>
                        <span className="font-bold text-zinc-200 font-mono">{villages.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-emerald-500" />
                        <span className="text-zinc-500">Gen</span>
                        <span className="font-bold text-emerald-400 font-mono">{(totalGeneration * 1000).toFixed(0)} kW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-red-400" />
                        <span className="text-zinc-500">Load</span>
                        <span className="font-bold text-red-400 font-mono">{(totalDemand * 1000).toFixed(0)} kW</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <TrendingUp size={11} className="text-sky-400" />
                        <span className="text-zinc-500">Stability</span>
                        <span className={`font-bold font-mono ${gridStability > 95 ? 'text-emerald-400' : gridStability > 80 ? 'text-amber-400' : 'text-red-400'}`}>
                            {gridStability.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Activity size={11} className="text-violet-400" />
                        <span className="text-zinc-500">Transfers</span>
                        <span className="font-bold text-zinc-200 font-mono">{activeTransfers}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={11} className="text-amber-400" />
                        <span className="text-zinc-500">Time</span>
                        <span className="font-bold font-mono text-zinc-200">{timeStr}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleToggle}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition shadow-lg ${
                        simulationRunning
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                    }`}
                >
                    {simulationRunning ? <Pause size={11} /> : <Play size={11} />}
                    {simulationRunning ? 'Pause' : 'Start'}
                </button>
            </div>
        </header>
    );
}
