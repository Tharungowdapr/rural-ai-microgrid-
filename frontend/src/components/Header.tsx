'use client';

import { useState } from 'react';
import { useGridStore } from '@/hooks/useGridStore';
import { Activity, Zap, TrendingUp, Brain, Shuffle, Play, Pause } from 'lucide-react';

export default function Header() {
    const {
        gridStability, activeTransfers, totalGeneration, totalDemand,
        villages, simulationRunning, updateForecasts, setAIInsights,
        setSimulationRunning, initializeVillages, setMetrics,
    } = useGridStore();
    const [predictLoading, setPredictLoading] = useState(false);

    const getHealthStatus = () => {
        if (gridStability > 95) return { color: 'text-emerald-500', label: 'OPERATIONAL' };
        if (gridStability > 80) return { color: 'text-amber-500', label: 'HIGH LOAD' };
        return { color: 'text-red-500', label: 'CRITICAL EVENT' };
    };

    const health = getHealthStatus();

    const handlePredict = async () => {
        setPredictLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/forecast');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                updateForecasts(data);
                setAIInsights([
                    { type: 'info', title: 'Forecast Complete', content: `6-hour prediction loaded (conf: ${(data[0].confidence * 100).toFixed(0)}%)`, severity: 1 },
                    { type: 'trend', title: 'Demand Trend', content: data[0].demand > data[data.length - 1].demand ? 'Demand rising — prepare for peak' : 'Demand stable', severity: 2 },
                ]);
            }
        } catch (e) {
            console.error('Predict failed', e);
        }
        setPredictLoading(false);
    };

    const handleRandomize = async () => {
        try {
            await fetch('http://localhost:8000/api/simulation/randomize', { method: 'POST' });
            await new Promise(r => setTimeout(r, 300));
            const res = await fetch('http://localhost:8000/api/villages');
            const data = await res.json();
            if (Array.isArray(data)) initializeVillages(data);
        } catch {}
    };

    const handleToggleSim = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/simulation/toggle', { method: 'POST' });
            const data = await res.json();
            setSimulationRunning(!data.paused);
        } catch {}
    };

    return (
        <>
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Rural Microgrid</h1>
                        <p className="text-zinc-400 text-sm mt-1">Decentralized Renewable Energy Network</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handlePredict} disabled={predictLoading}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition">
                        <Brain size={14} />
                        {predictLoading ? "Predicting..." : "Predict Load"}
                    </button>
                    <button onClick={handleRandomize}
                        className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition">
                        <Shuffle size={14} />
                        Random
                    </button>
                    <button onClick={handleToggleSim}
                        className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition">
                        {simulationRunning ? <Pause size={14} /> : <Play size={14} />}
                        {simulationRunning ? "Pause" : "Start"}
                    </button>

                    <div className="flex items-center gap-2 bg-zinc-800/80 rounded-full px-3 py-1.5">
                        <div className={`w-2 h-2 rounded-full animate-pulse ${simulationRunning ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
                        <span className="text-xs font-semibold text-zinc-200 tracking-wide uppercase">
                            {simulationRunning ? 'Live' : 'Paused'}
                        </span>
                    </div>

                    <div className={`flex items-center gap-2 bg-zinc-800/80 rounded-full px-3 py-1.5 ${health.color}`}>
                        <Activity size={14} />
                        <span className="text-xs font-semibold tracking-wide uppercase">{health.label}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-5 gap-4 mt-6">
                <MetricCard label="Total Villages" value={villages ? villages.length.toString() : "0"} icon={<Activity size={16} />} />
                <MetricCard label="Active Transfers" value={activeTransfers.toString()} icon={<Zap size={16} />} />
                <MetricCard label="Grid Stability" value={`${gridStability.toFixed(1)}%`} icon={<TrendingUp size={16} />} />
                <MetricCard label="Total Solar Output" value={`${totalGeneration.toFixed(2)} MW`} icon={<Zap size={16} />} />
                <MetricCard label="Total Demand" value={`${totalDemand.toFixed(2)} MW`} icon={<Zap size={16} />} />
            </div>
        </>
    );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-zinc-900/80 backdrop-blur-md border border-zinc-800/50 p-4 rounded-xl flex items-center gap-4 hover:border-zinc-700 transition shadow-lg shadow-black/20">
            <div className="text-sky-400 bg-sky-900/30 p-2 rounded-lg">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-400 truncate">{label}</p>
                <p className="text-xl font-bold text-zinc-100 mt-0.5">{value}</p>
            </div>
        </div>
    );
}
