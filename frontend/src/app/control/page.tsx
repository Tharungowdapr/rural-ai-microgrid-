'use client';

import { useState } from 'react';
import { useGridStore, Village } from '@/hooks/useGridStore';
import { Shuffle, AlertTriangle, Play, Pause, Zap, Gauge } from 'lucide-react';

const SCENARIOS = [
    { id: 'heatwave', label: 'Heatwave', desc: 'Extreme 45\u00B0C temperature', icon: '\uD83D\uDD25', color: 'bg-red-600/80 hover:bg-red-500' },
    { id: 'cloudcover', label: 'Heavy Clouds', desc: '95% cloud coverage', icon: '\u2601\uFE0F', color: 'bg-zinc-600/80 hover:bg-zinc-500' },
    { id: 'hospital-surge', label: 'Hospital Surge', desc: '+100kW demand spike', icon: '\uD83C\uDFE5', color: 'bg-amber-600/80 hover:bg-amber-500' },
    { id: 'relay-failure', label: 'Relay Failure', desc: 'Reroute transfers', icon: '\u26A1', color: 'bg-orange-600/80 hover:bg-orange-500' },
    { id: 'blackout', label: 'Blackout', desc: 'One village goes offline', icon: '\uD83D\uDD6F\uFE0F', color: 'bg-red-800/80 hover:bg-red-700' },
    { id: 'storm', label: 'Storm', desc: '80 km/h wind, 100% clouds', icon: '\uD83C\uDF2A\uFE0F', color: 'bg-violet-600/80 hover:bg-violet-500' },
];

const SPEEDS = [0.5, 1, 2, 4];

export default function ControlPage() {
    const { villages, simulationRunning } = useGridStore();
    const [activeScenario, setActiveScenario] = useState<string | null>(null);
    const [speed, setSpeed] = useState(1);
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    const triggerScenario = async (id: string) => {
        setActiveScenario(id);
        try {
            const res = await fetch(`http://localhost:8000/api/scenario/${id}`, { method: 'POST' });
            if (res.ok) showFeedback(`${id} scenario triggered`);
        } catch { showFeedback('Failed to trigger scenario'); }
        setTimeout(() => setActiveScenario(null), 1500);
    };

    const handleSpeed = async (s: number) => {
        try {
            const res = await fetch(`http://localhost:8000/api/control/simulation/speed/${s}`, { method: 'POST' });
            if (res.ok) { setSpeed(s); useGridStore.getState().setSimulationSpeed(s); showFeedback(`Speed set to ${s}x`); }
        } catch {}
    };

    const handleToggle = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/simulation/toggle', { method: 'POST' });
            const data = await res.json();
            useGridStore.getState().setSimulationRunning(!data.paused);
            showFeedback(data.paused ? 'Simulation paused' : 'Simulation started');
        } catch {}
    };

    const handleRandomize = async () => {
        try {
            await fetch('http://localhost:8000/api/simulation/randomize', { method: 'POST' });
            await new Promise(r => setTimeout(r, 300));
            const res = await fetch('http://localhost:8000/api/villages');
            const data = await res.json();
            if (Array.isArray(data)) useGridStore.getState().initializeVillages(data);
            showFeedback('All parameters randomized');
        } catch {}
    };

    const handleEmergencyAll = async () => {
        try {
            for (const v of villages) {
                await fetch(`http://localhost:8000/api/control/emergency/${v.id}?spike_kw=80`, { method: 'POST' });
            }
            showFeedback('Emergency spike (+80 kW) sent to all villages');
        } catch {}
    };

    return (
        <div className="h-full flex flex-col gap-5 overflow-y-auto">
            <div>
                <h2 className="text-xl font-bold text-zinc-100">Simulation Control</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Manage simulation state, scenarios, and emergency controls</p>
            </div>

            {feedback && (
                <div className="glass-card px-3 py-2 text-xs font-bold text-sky-400">{feedback}</div>
            )}

            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Play size={16} className="text-emerald-500" />
                        <h3 className="text-sm font-bold text-zinc-200">Simulation</h3>
                    </div>
                    <button onClick={handleToggle}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition shadow-lg ${
                            simulationRunning
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                        }`}>
                        {simulationRunning ? <><Pause size={14} className="inline mr-2" />Pause</> : <><Play size={14} className="inline mr-2" />Start</>}
                    </button>
                    <button onClick={handleRandomize}
                        className="w-full mt-3 py-3 bg-amber-600/80 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10">
                        <Shuffle size={14} /> Randomize All
                    </button>
                    <button onClick={handleEmergencyAll}
                        className="w-full mt-3 py-3 bg-red-600/80 hover:bg-red-500 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/10">
                        <AlertTriangle size={14} /> Emergency All
                    </button>
                </div>

                <div className="glass-panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Gauge size={16} className="text-sky-500" />
                        <h3 className="text-sm font-bold text-zinc-200">Speed</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {SPEEDS.map((s: number) => (
                            <button key={s} onClick={() => handleSpeed(s)}
                                className={`py-3 rounded-xl text-sm font-bold transition shadow-lg ${
                                    speed === s
                                        ? 'bg-sky-600 text-white shadow-sky-500/20'
                                        : 'glass-input text-zinc-300 hover:bg-white/5'
                                }`}>
                                {s}x
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 text-center mt-3 font-mono">Current: {speed}x speed</p>
                </div>

                <div className="glass-panel p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={16} className="text-amber-500" />
                        <h3 className="text-sm font-bold text-zinc-200">Per-Village Emergency</h3>
                    </div>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                        {villages.map((v: Village) => (
                            <div key={v.id} className="flex items-center justify-between glass-input rounded-lg px-3 py-2">
                                <span className="text-xs text-zinc-300">{v.name}</span>
                                <div className="flex gap-1">
                                    <button onClick={async () => {
                                        await fetch(`http://localhost:8000/api/control/emergency/${v.id}?spike_kw=50`, { method: 'POST' });
                                        showFeedback(`${v.name}: +50 kW spike`);
                                    }} className="text-[10px] bg-amber-600/80 hover:bg-amber-500 text-white px-2 py-1 rounded font-bold transition">
                                        +50
                                    </button>
                                    <button onClick={async () => {
                                        await fetch(`http://localhost:8000/api/control/emergency/${v.id}?spike_kw=100`, { method: 'POST' });
                                        showFeedback(`${v.name}: +100 kW spike`);
                                    }} className="text-[10px] bg-red-600/80 hover:bg-red-500 text-white px-2 py-1 rounded font-bold transition">
                                        +100
                                    </button>
                                    <button onClick={async () => {
                                        await fetch(`http://localhost:8000/api/control/emergency/${v.id}?spike_kw=0`, { method: 'POST' });
                                        showFeedback(`${v.name}: spike cleared`);
                                    }} className="text-[10px] btn-glass text-zinc-400 px-2 py-1 rounded transition">
                                        Clear
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="glass-panel p-5">
                <h3 className="text-sm font-bold text-zinc-200 mb-1">Scenarios</h3>
                <p className="text-[10px] text-zinc-500 mb-4">Trigger predefined events to test grid response</p>
                <div className="grid grid-cols-3 gap-3">
                    {SCENARIOS.map((s) => (
                        <button key={s.id} onClick={() => triggerScenario(s.id)}
                            disabled={activeScenario !== null}
                            className={`${s.color} text-white rounded-xl p-4 text-left transition disabled:opacity-50 shadow-lg`}>
                            <div className="text-lg mb-1">{s.icon}</div>
                            <div className="text-sm font-bold">{s.label}</div>
                            <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="glass-panel p-5">
                <h3 className="text-sm font-bold text-zinc-200 mb-3">Load Shedding</h3>
                <div className="grid grid-cols-2 gap-2">
                    {villages.map((v: Village) => (
                        <div key={v.id} className="flex items-center justify-between glass-input rounded-lg px-3 py-2">
                            <span className="text-xs text-zinc-300">{v.name}</span>
                            <div className="flex gap-1">
                                {[25, 50, 100].map((pct: number) => (
                                    <button key={pct} onClick={async () => {
                                        await fetch(`http://localhost:8000/api/control/load/${v.id}/shed?percentage=${pct}`, { method: 'POST' });
                                        showFeedback(`${v.name}: shed ${pct}%`);
                                    }} className="text-[10px] bg-orange-600/80 hover:bg-orange-500 text-white px-2 py-1 rounded font-bold transition">
                                        {pct}%
                                    </button>
                                ))}
                                <button onClick={async () => {
                                    await fetch(`http://localhost:8000/api/control/load/${v.id}/shed?percentage=0`, { method: 'POST' });
                                    showFeedback(`${v.name}: shed cleared`);
                                }} className="text-[10px] btn-glass text-zinc-400 px-2 py-1 rounded transition">
                                    Clear
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
