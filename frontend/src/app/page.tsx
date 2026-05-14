'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import AIPanel from '@/components/AIPanel';
import TransferLog from '@/components/TransferLog';
import WeatherPanel from '@/components/WeatherPanel';
import AlertCenter from '@/components/AlertCenter';
import VillageBar from '@/components/VillageBar';
import CityControlModal from '@/components/CityControlModal';
import { useGridStore, Village } from '@/hooks/useGridStore';
import { Settings } from 'lucide-react';
import SystemSettings from '@/components/SystemSettings';

const Topology = dynamic(() => import('@/components/Topology'), { ssr: false });

export default function Dashboard() {
    const [selectedVillage, setSelectedVillage] = useState<Village | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    return (
        <div className="w-screen h-screen overflow-hidden bg-[#121212] relative font-roboto text-on-surface">

            <div className="absolute inset-0 z-0 pointer-events-auto">
                <Topology onCityClick={(village) => setSelectedVillage(village)} />
            </div>

            <div className="absolute inset-0 z-30 pointer-events-none p-3 flex flex-col">

                <div className="w-full flex-none pointer-events-auto bg-zinc-900/70 backdrop-blur-md border border-zinc-800/50 rounded-xl">
                    <Header />
                </div>

                <div className="flex-1 relative">
                    <div className="absolute left-0 top-0 bottom-0 w-[220px] flex flex-col gap-3 pointer-events-auto overflow-y-auto">
                        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-3">
                            <AlertCenter />
                        </div>
                        <div className="flex-1 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-3 min-h-[150px]">
                            <TransferLog />
                        </div>
                    </div>

                    <div className="absolute right-0 top-0 bottom-0 w-[220px] flex flex-col gap-3 pointer-events-auto overflow-y-auto">
                        <div className="flex-1 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-3">
                            <AIPanel />
                        </div>
                        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl p-3">
                            <WeatherPanel />
                        </div>
                    </div>
                </div>

                <div className="w-full flex-none pointer-events-auto bg-zinc-900/60 backdrop-blur-md border border-zinc-800/50 rounded-xl px-3 py-2">
                    <VillageBar />
                </div>
            </div>

            <button
                onClick={() => setShowSettings(true)}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700 backdrop-blur-md border border-zinc-700/50 rounded-full flex items-center gap-2 text-zinc-300 pointer-events-auto transition"
            >
                <Settings size={16} />
                <span className="text-xs font-bold tracking-widest uppercase">System Settings</span>
            </button>

            <SystemSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
            <CityControlModal village={selectedVillage} onClose={() => setSelectedVillage(null)} />
        </div>
    );
}
