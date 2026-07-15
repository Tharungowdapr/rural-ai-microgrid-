// @ts-nocheck
'use client';

import { useState } from 'react';
import { useGridStore } from '@/hooks/useGridStore';
import { AlertTriangle, Info, Zap, Brain, Bell, X, Radio, Shield } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    CRITICAL: <AlertTriangle size={10} className="text-red-500" />,
    WARNING: <AlertTriangle size={10} className="text-amber-500" />,
    INFO: <Info size={10} className="text-sky-500" />,
    AI: <Brain size={10} className="text-violet-500" />,
    EMS: <Zap size={10} className="text-emerald-500" />,
    TRANSFER: <Radio size={10} className="text-emerald-500" />,
};

const TYPE_COLORS: Record<string, string> = {
    CRITICAL: 'border-red-500 bg-red-500/10',
    WARNING: 'border-amber-500 bg-amber-500/5',
    INFO: 'border-sky-500 bg-sky-500/5',
    AI: 'border-violet-500 bg-violet-500/5',
    EMS: 'border-emerald-500 bg-emerald-500/5',
    TRANSFER: 'border-emerald-500 bg-emerald-500/5',
};

export default function AlertCenter() {
    const { alerts } = useGridStore();
    const [collapsed, setCollapsed] = useState(false);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const visible = alerts.filter(a => !dismissed.has(a.id)).slice(0, 10);

    return (
        <div className="relative">
            <button onClick={() => setCollapsed(!collapsed)}
                className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-200 uppercase tracking-wide transition mb-1.5">
                <Bell size={11} />
                ALERTS
                {visible.length > 0 && (
                    <span className="bg-red-500 text-white text-[9px] rounded-full px-1.5 py-0">{visible.length}</span>
                )}
            </button>

            {!collapsed && (
                <div className="space-y-1 max-h-[160px] overflow-y-auto">
                    {visible.length === 0 ? (
                        <p className="text-[10px] text-zinc-500 text-center py-1">No alerts</p>
                    ) : (
                        visible.map((a) => (
                            <div key={a.id}
                                className={`flex items-start gap-1.5 text-[10px] rounded px-1.5 py-1 border-l-2 ${TYPE_COLORS[a.type] || 'border-zinc-700'}`}>
                                <span className="flex-shrink-0 mt-0.5">{TYPE_ICONS[a.type] || <Info size={10} className="text-zinc-400" />}</span>
                                <span className="flex-1 text-zinc-300 truncate">{a.message}</span>
                                <button onClick={() => setDismissed(prev => new Set(prev).add(a.id))}
                                    className="text-zinc-600 hover:text-zinc-400 flex-shrink-0">
                                    <X size={10} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}