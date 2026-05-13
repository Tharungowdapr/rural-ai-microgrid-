'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import MetricsStrip from '@/components/MetricsStrip';
import Topology from '@/components/Topology';
import VillageCards from '@/components/VillageCards';
import AIPanel from '@/components/AIPanel';
import TransferLog from '@/components/TransferLog';
import AlertStack from '@/components/AlertStack';
import BatteryMonitor from '@/components/BatteryMonitor';
import WeatherPanel from '@/components/WeatherPanel';
import ScenarioControls from '@/components/ScenarioControls';
import SystemSettings from '@/components/SystemSettings';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useGridStore } from '@/hooks/useGridStore';
import { Settings } from 'lucide-react';

export default function Dashboard() {
    const { send } = useWebSocket();
    const { simulationRunning, setSimulationRunning } = useGridStore();
    const [showSettings, setShowSettings] = useState(false);
    useEffect(() => {
        setSimulationRunning(true);
    }, [setSimulationRunning]);

return (
    <div className="w-screen h-screen bg-deep-blue overflow-hidden flex flex-col">
        {/* Header */}
        <Header />

        {/* Settings Button */}
        <button
            onClick={() => setShowSettings(true)}
            className="fixed top-24 right-4 z-40 p-2 glass-card hover:glass-card-hover rounded transition flex items-center gap-2 text-cyan glow-text"
            title="Open System Settings"
        >
            <Settings size={20} />
            <span className="text-xs font-bold">SETTINGS</span>
        </button>

        {/* Settings Modal */}
        <SystemSettings isOpen={showSettings} onClose={() => setShowSettings(false)} />

        {/* Main Grid Layout */}
        <div className="flex-1 flex gap-4 p-4">
            {/* Left Column: Topology and Village Cards */}
            <div className="flex-1 flex flex-col gap-4">
                {/* Topology Map */}
                <div className="flex-1 glass-card p-4 rounded-lg">
                    <Topology />
                </div>

                {/* Village Cards Grid */}
                <div className="glass-card p-4 rounded-lg overflow-y-auto max-h-64">
                    <VillageCards />
                </div>
            </div>

            {/* Right Column: AI Panel and Controls */}
            <div className="w-96 flex flex-col gap-4">
                {/* AI Panel */}
                <div className="flex-1 glass-card p-4 rounded-lg overflow-y-auto">
                    <AIPanel />
                </div>

                {/* Weather Panel */}
                <div className="glass-card p-4 rounded-lg">
                    <WeatherPanel />
                </div>

                {/* Scenario Controls */}
                <div className="glass-card p-4 rounded-lg">
                    <ScenarioControls />
                </div>
            </div>
        </div>

        {/* Bottom Section: Transfers, Batteries, Alerts */}
        <div className="flex gap-4 p-4 h-64">
            {/* Transfer Log */}
            <div className="flex-1 glass-card p-4 rounded-lg overflow-y-auto">
                <TransferLog />
            </div>

            {/* Battery Monitor */}
            <div className="flex-1 glass-card p-4 rounded-lg overflow-y-auto">
                <BatteryMonitor />
            </div>
        </div>

        {/* Alert Stack - Floating */}
        <AlertStack />
    </div>
    );
}
