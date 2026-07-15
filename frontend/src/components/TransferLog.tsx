// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Radio, AlertTriangle, Zap, Brain, Info } from 'lucide-react';
import { useGridStore } from '@/hooks/useGridStore';

interface LogEntry {
    id: string;
    type: 'TRANSFER' | 'CRITICAL' | 'WARNING' | 'INFO' | 'AI' | 'EMS';
    message: string;
    timestamp: number;
    severity: number;
    status?: string;
    source?: string;
    destination?: string;
    rate?: number;
}

export default function TransferLog() {
    const { transfers, alerts } = useGridStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const logs: LogEntry[] = [
        ...transfers.map(t => ({
            id: t.id,
            type: 'TRANSFER' as const,
            message: `${t.source} → ${t.destination} @ ${t.rate.toFixed(0)} kW`,
            timestamp: t.startTime,
            severity: 1,
            status: t.status,
            source: t.source,
            destination: t.destination,
            rate: t.rate,
        })),
        ...alerts.map(a => ({
            id: a.id,
            type: a.type as LogEntry['type'],
            message: a.message,
            timestamp: a.timestamp,
            severity: a.severity,
            status: a.type,
        })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    const getLogColor = (type: string, status: string) => {
        if (type === 'TRANSFER') {
            return status === 'ACTIVE' ? 'text-emerald-400' : 'text-outline';
        }
        switch (status) {
            case 'CRITICAL': return 'text-red-500';
            case 'WARNING': return 'text-amber-500';
            case 'AI': return 'text-violet-500';
            case 'EMS': return 'text-sky-500';
            default: return 'text-outline';
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TRANSFER': return <ArrowRight size={10} className="text-emerald-400 flex-shrink-0" />;
            case 'CRITICAL': return <AlertTriangle size={10} className="text-red-500 flex-shrink-0" />;
            case 'WARNING': return <AlertTriangle size={10} className="text-amber-500 flex-shrink-0" />;
            case 'AI': return <Brain size={10} className="text-violet-500 flex-shrink-0" />;
            case 'EMS': return <Zap size={10} className="text-sky-500 flex-shrink-0" />;
            default: return <Info size={10} className="text-outline flex-shrink-0" />;
        }
    };

    return (
        <div className="h-full flex flex-col gap-1">
            <h3 className="text-xs font-bold text-sky-500 tracking-wide uppercase">
                SYSTEM LOG
            </h3>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                {logs.length === 0 ? (
                    <p className="text-[10px] text-outline text-center py-2">No system events...</p>
                ) : (
                    logs.slice(0, 15).map((log, index) => (
                        <div
                            key={`${log.id}-${index}`}
                            className="text-[10px] font-mono bg-zinc-800/50 rounded px-1.5 py-0.5 border-l-2 border-emerald-500/30"
                        >
                            <div className="flex gap-1 items-center">
                                <span className="text-outline flex-shrink-0">
                                    [{mounted ? new Date(log.timestamp).toLocaleTimeString() : '--:--:--'}]
                                </span>
                                {getIcon(log.type)}
                                <span className={`flex-1 ${getLogColor(log.type, log.status || '')}`}>
                                    {log.message}
                                </span>
                                {log.type === 'TRANSFER' && log.status === 'ACTIVE' && (
                                    <span className="text-emerald-400 animate-pulse">●</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}