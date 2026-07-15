'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Map, LayoutGrid, Gamepad2, Brain, Cloud, ScrollText,
    Settings, Wifi, WifiOff, Activity
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGridStore } from '@/hooks/useGridStore';

const NAV_ITEMS = [
    { href: '/', label: 'Dashboard', icon: Map },
    { href: '/villages', label: 'Villages', icon: LayoutGrid },
    { href: '/control', label: 'Control', icon: Gamepad2 },
    { href: '/ai', label: 'AI Intel', icon: Brain },
    { href: '/weather', label: 'Weather', icon: Cloud },
    { href: '/logs', label: 'Logs', icon: ScrollText },
    { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { connectionStatus } = useWebSocket();
    const { simulationRunning, gridStability } = useGridStore();

    const healthLabel = gridStability > 95 ? 'OPERATIONAL' : gridStability > 80 ? 'HIGH LOAD' : 'CRITICAL';
    const healthColor = gridStability > 95 ? 'text-emerald-500' : gridStability > 80 ? 'text-amber-500' : 'text-red-500';

    return (
        <aside className="w-16 h-full glass-sidebar flex flex-col items-center py-3 shrink-0">
            <div className="mb-4 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-lg bg-sky-600/90 flex items-center justify-center shadow-lg shadow-sky-500/20">
                    <Activity size={16} className="text-white" />
                </div>
                <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-wider">Grid</span>
            </div>

            <nav className="flex-1 flex flex-col gap-1 w-full px-1.5">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            className={`flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all text-[8px] font-bold uppercase tracking-wide ${
                                active
                                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/25 shadow-lg shadow-sky-500/5'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                            }`}
                        >
                            <Icon size={15} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="flex flex-col items-center gap-2 px-1.5 mt-auto">
                <div className={`flex flex-col items-center gap-0.5 text-[7px] font-bold uppercase ${
                    connectionStatus === 'connected' ? 'text-emerald-500' :
                    connectionStatus === 'connecting' ? 'text-amber-500' : 'text-red-500'
                }`}>
                    {connectionStatus === 'connected' ? <Wifi size={12} /> : <WifiOff size={12} />}
                    <span>{connectionStatus === 'connected' ? 'Online' : 'Offline'}</span>
                </div>

                <div className="w-8 h-px bg-white/5" />

                <div className={`flex flex-col items-center gap-0.5 text-[7px] font-bold uppercase ${healthColor}`}>
                    <Activity size={11} />
                    <span className="text-center leading-tight">{healthLabel}</span>
                </div>

                <div className="w-8 h-px bg-white/5" />

                <div className="flex flex-col items-center gap-0.5">
                    <div className={`w-2 h-2 rounded-full ${simulationRunning ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
                    <span className="text-[7px] font-bold text-zinc-500 uppercase">{simulationRunning ? 'Live' : 'Off'}</span>
                </div>
            </div>
        </aside>
    );
}
