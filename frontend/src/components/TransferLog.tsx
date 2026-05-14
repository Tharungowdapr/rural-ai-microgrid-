'use client';

import { useEffect, useState } from 'react';
import { useGridStore } from '@/hooks/useGridStore';
import { ArrowRight, Radio } from 'lucide-react';

export default function TransferLog() {
    const { transfers, alerts } = useGridStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Create combined log of transfers and alerts
    const logs = [
        ...transfers.map((t) => ({
            id: t.id,
            timestamp: t.startTime,
            type: 'TRANSFER',
            message: `Transfer: ${t.source} → ${t.destination} (${t.rate.toFixed(1)} kW)`,
            status: t.status,
        })),
        ...alerts.slice(0, 10).map((a) => ({
            id: a.id,
            timestamp: a.timestamp,
            type: 'ALERT',
            message: a.message,
            status: a.type,
        })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    const getLogColor = (type: string, status: string) => {
        if (type === 'TRANSFER') {
            return status === 'ACTIVE' ? 'text-secondary' : 'text-outline';
        }
        switch (status) {
            case 'CRITICAL':
                return 'text-red-500';
            case 'WARNING':
                return 'text-amber-500';
            case 'AI':
                return 'text-violet-500';
            case 'EMS':
                return 'text-sky-500';
            default:
                return 'text-outline';
        }
    };

    return (
        <div className="h-full flex flex-col gap-2">
            <h3 className="text-sm font-bold  text-sky-500 ">
                LIVE SYSTEM LOG
            </h3>

            <div className="flex-1 overflow-y-auto space-y-1">
                {logs.length === 0 ? (
                    <p className="text-xs text-outline text-center py-4">Waiting for system events...</p>
                ) : (
                    logs.slice(0, 20).map((log, index) => (
                        <div
                            key={`${log.id}-${index}`}
                            className="text-xs font-mono bg-zinc-800/50 rounded px-2 py-1 border-l-2 border-cyan border-opacity-20"
                        >
                            <div className="flex gap-2 items-center">
                                <span className="text-outline flex-shrink-0">
                                    [{mounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}]
                                </span>

                                {log.type === 'TRANSFER' ? (
                                    <ArrowRight size={12} className="text-secondary flex-shrink-0" />
                                ) : (
                                    <Radio size={12} className="text-violet-500 flex-shrink-0" />
                                )}

                                <span className={`flex-1 ${getLogColor(log.type, log.status)}`}>
                                    {log.message}
                                </span>

                                <span className="text-gray-600 flex-shrink-0">
                                    {log.type === 'TRANSFER' && log.status === 'ACTIVE' && (
                                        <span className="text-secondary animate-pulse">●</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
