'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { Battery, Zap, Droplets, AlertCircle } from 'lucide-react';

export default function VillageCards() {
    const { villages } = useGridStore();

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'SURPLUS':
                return 'bg-neon-green text-deep-blue';
            case 'BALANCED':
                return 'bg-cyan text-deep-blue';
            case 'WARNING':
                return 'bg-amber text-deep-blue';
            case 'DEFICIT':
                return 'bg-critical-red text-white';
            default:
                return 'bg-gray-600 text-white';
        }
    };

    const getBatteryBarClass = (soc: number) => {
        if (soc > 70) return 'bg-neon-green';
        if (soc > 40) return 'bg-amber';
        return 'bg-critical-red';
    };

    if (villages.length === 0) {
        return (
            <div className="text-center text-gray-400 py-4">
                <p className="text-sm">No villages data available</p>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-sm font-bold font-orbitron text-cyan mb-3 glow-text">
                VILLAGE STATUS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto">
                {villages.map((village) => (
                    <div key={village.id} className="glass-card p-3 rounded hover:glass-card-hover transition">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold font-orbitron text-cyan truncate">
                                {village.name}
                            </p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusBadgeClass(village.status)}`}>
                                {village.status}
                            </span>
                        </div>

                        {/* Battery Bar */}
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-400">Battery</span>
                                <span className="text-xs font-bold text-neon-green">{Math.round(village.soc)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full ${getBatteryBarClass(village.soc)} transition-all`}
                                    style={{ width: `${village.soc}%` }}
                                />
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="flex items-center gap-1">
                                <Zap size={12} className="text-neon-green" />
                                <div>
                                    <p className="text-gray-400">Solar</p>
                                    <p className="font-bold text-neon-green">
                                        {Math.round(village.solarGeneration)} kW
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Droplets size={12} className="text-cyan" />
                                <div>
                                    <p className="text-gray-400">Demand</p>
                                    <p className="font-bold text-cyan">{Math.round(village.demand)} kW</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Battery size={12} className="text-amber" />
                                <div>
                                    <p className="text-gray-400">Freq</p>
                                    <p className="font-bold text-amber">{village.frequency.toFixed(1)} Hz</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <AlertCircle size={12} className="text-critical-red" />
                                <div>
                                    <p className="text-gray-400">Temp</p>
                                    <p className="font-bold text-critical-red">{Math.round(village.temperature)}°C</p>
                                </div>
                            </div>
                        </div>

                        {/* Load Distribution */}
                        <div className="mt-2 pt-2 border-t border-cyan border-opacity-20">
                            <div className="flex gap-1">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">Critical</p>
                                    <p className="text-xs font-bold text-neon-green">{Math.round(village.criticalLoad)} kW</p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400">Standard</p>
                                    <p className="text-xs font-bold text-amber">{Math.round(village.standardLoad)} kW</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
