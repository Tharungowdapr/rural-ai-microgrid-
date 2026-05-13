'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { Activity, Zap, TrendingUp } from 'lucide-react';

export default function Header() {
    const { gridStability, activeTransfers, totalGeneration, totalDemand } =
        useGridStore();

    const getHealthStatus = () => {
        if (gridStability > 95) return { color: 'text-neon-green', label: 'OPERATIONAL' };
        if (gridStability > 80) return { color: 'text-amber', label: 'HIGH LOAD' };
        return { color: 'text-critical-red', label: 'CRITICAL EVENT' };
    };

    const health = getHealthStatus();

    return (
        <div className="bg-darker-blue border-b border-cyan border-opacity-30 px-6 py-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-4xl font-bold font-orbitron glow-text-strong">
                        RURAL MICROGRID
                    </h1>
                    <p className="text-cyan text-sm mt-1 glow-text">
                        Decentralized AI-Powered Renewable Energy Network
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    {/* Live Badge */}
                    <div className="flex items-center gap-2 glass-card px-4 py-2">
                        <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold font-orbitron text-neon-green">
                            LIVE SIMULATION
                        </span>
                    </div>

                    {/* Health Status */}
                    <div className={`flex items-center gap-2 glass-card px-4 py-2 ${health.color}`}>
                        <Activity size={16} />
                        <span className="text-xs font-bold font-orbitron">{health.label}</span>
                    </div>

                    {/* Time */}
                    <div className="glass-card px-4 py-2">
                        <div id="clock" className="text-sm font-mono glow-text">
                            00:00:00
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-5 gap-4">
                <MetricCard
                    label="Total Villages"
                    value="8"
                    icon={<Activity size={16} />}
                />
                <MetricCard
                    label="Active Transfers"
                    value={activeTransfers.toString()}
                    icon={<Zap size={16} />}
                />
                <MetricCard
                    label="Grid Stability"
                    value={`${gridStability.toFixed(1)}%`}
                    icon={<TrendingUp size={16} />}
                />
                <MetricCard
                    label="Total Solar Output"
                    value={`${totalGeneration.toFixed(2)} MW`}
                    icon={<Zap size={16} />}
                />
                <MetricCard
                    label="Total Demand"
                    value={`${totalDemand.toFixed(2)} MW`}
                    icon={<Zap size={16} />}
                />
            </div>
        </div>
    );
}

function MetricCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="glass-card p-3 rounded flex items-center gap-2 hover:glass-card-hover transition">
            <div className="text-cyan opacity-70">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-400 truncate">{label}</p>
                <p className="text-lg font-bold glow-text font-orbitron">{value}</p>
            </div>
        </div>
    );
}
