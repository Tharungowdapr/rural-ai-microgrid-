'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { Battery, Thermometer, RotateCw } from 'lucide-react';

export default function BatteryMonitor() {
    const { villages } = useGridStore();

    const getBatteryStatus = (soc: number) => {
        if (soc > 70) return { color: 'bg-neon-green', textColor: 'text-neon-green' };
        if (soc > 40) return { color: 'bg-amber', textColor: 'text-amber' };
        return { color: 'bg-critical-red', textColor: 'text-critical-red' };
    };

    return (
        <div className="h-full flex flex-col gap-2">
            <h3 className="text-sm font-bold font-orbitron text-cyan glow-text">
                BATTERY MONITOR
            </h3>

            <div className="flex-1 overflow-y-auto space-y-2">
                {villages.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">No battery data</p>
                ) : (
                    villages.map((village) => {
                        const status = getBatteryStatus(village.soc);
                        return (
                            <div key={village.id} className="glass-card p-2 rounded">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1">
                                        <Battery size={12} className="text-cyan" />
                                        <span className="text-xs font-bold text-cyan">{village.name}</span>
                                    </div>
                                    <span className={`text-xs font-bold ${status.textColor}`}>
                                        {Math.round(village.soc)}%
                                    </span>
                                </div>

                                {/* Battery Bar */}
                                <div className="w-full bg-gray-700 rounded-full h-1 overflow-hidden mb-1">
                                    <div
                                        className={`h-full ${status.color} transition-all`}
                                        style={{ width: `${village.soc}%` }}
                                    />
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-3 gap-1 text-xs">
                                    <div className="flex items-center gap-0.5">
                                        <Thermometer size={10} className="text-amber" />
                                        <span className="text-gray-400">Temp:</span>
                                        <span className="text-amber">{Math.round(village.temperature)}°C</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <Battery size={10} className="text-cyan" />
                                        <span className="text-gray-400">Health:</span>
                                        <span className="text-cyan">95%</span>
                                    </div>
                                    <div className="flex items-center gap-0.5">
                                        <RotateCw size={10} className="text-neon-green" />
                                        <span className="text-gray-400">Cycles:</span>
                                        <span className="text-neon-green">342</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
