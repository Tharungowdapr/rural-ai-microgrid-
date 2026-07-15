// @ts-nocheck
'use client';

import { useState } from 'react';
import { useSystemConfig, SystemConfig } from '@/hooks/useSystemConfig';
import { Settings, Save, RotateCcw, X, Play, Zap, CloudSun, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SystemSettingsModal({ isOpen, onClose }: SystemSettingsModalProps) {
    const { config, updateConfig, resetConfig } = useSystemConfig();
    const [localConfig, setLocalConfig] = useState(config);
    const [activeTab, setActiveTab] = useState<'city' | 'charging' | 'solar' | 'ems' | 'battery' | 'scenarios' | 'speed'>('city');

    const handleChange = (key: keyof SystemConfig, value: any) => {
        setLocalConfig((prev) => ({
            ...prev,
            [key]: typeof value === 'string' ? parseFloat(value) : value,
        }));
    };

    const handleSave = async () => {
        updateConfig(localConfig);
        try {
            await fetch('http://localhost:8000/api/weather', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cloudCover: localConfig.averageCloudCover,
                    irradiance: localConfig.baseSolarIrradiance,
                }),
            });
            for (const v of (await (await fetch('http://localhost:8000/api/villages')).json())) {
                await fetch(`http://localhost:8000/api/villages/${v.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chargingRate: localConfig.maxChargeRate,
                        maxCapacity: localConfig.averageHubCapacity,
                    }),
                });
            }
        } catch {}
        onClose();
    };

    const handleReset = () => {
        resetConfig();
        setLocalConfig(useSystemConfig.getState().config);
    };

    const tabs = [
        { id: 'city' as const, label: 'City Config' },
        { id: 'charging' as const, label: 'Charging' },
        { id: 'solar' as const, label: 'Solar' },
        { id: 'ems' as const, label: 'EMS' },
        { id: 'battery' as const, label: 'Battery' },
        { id: 'scenarios' as const, label: 'Scenarios' },
        { id: 'speed' as const, label: 'Speed' },
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-zinc-800/50 border-2 border-sky-500/50 rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto"
            >
                {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-sky-500/30 bg-black sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Settings size={24} className="text-sky-500" />
                        <h2 className="text-xl font-bold  text-sky-500 ">
                            SYSTEM CONFIGURATION
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-3 border-b border-sky-500/30 bg-black sticky top-16 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition ${activeTab === tab.id
                                    ? 'bg-sky-600 text-white'
                                    : 'bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg text-sky-500 hover:bg-zinc-800'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {activeTab === 'city' && (
                        <CityConfig config={localConfig} onChange={handleChange} />
                    )}
                    {activeTab === 'charging' && (
                        <ChargingConfig config={localConfig} onChange={handleChange} />
                    )}
                    {activeTab === 'solar' && (
                        <SolarConfig config={localConfig} onChange={handleChange} />
                    )}
                    {activeTab === 'ems' && (
                        <EMSConfig config={localConfig} onChange={handleChange} />
                    )}
                    {activeTab === 'battery' && (
                        <BatteryConfig config={localConfig} onChange={handleChange} />
                    )}
                    {activeTab === 'scenarios' && (
                        <ScenarioConfig />
                    )}
                    {activeTab === 'speed' && (
                        <SpeedConfig config={localConfig} onChange={handleChange} />
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-4 border-t border-sky-500/30 bg-black sticky bottom-0">
                    <button onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-600/80 hover:bg-amber-500 text-zinc-900 font-bold rounded transition">
                        <RotateCcw size={16} /> Reset
                    </button>
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 text-sky-500 font-bold rounded transition">
                        Cancel
                    </button>
                    <button onClick={handleSave}
                        className="flex items-center gap-2 flex-1 px-4 py-2 bg-emerald-600/80 hover:bg-emerald-500 text-zinc-900 font-bold rounded transition">
                        <Save size={16} /> Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function CityConfig({
    config,
    onChange,
}: {
    config: SystemConfig;
    onChange: (key: keyof SystemConfig, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500 ">City/Grid Configuration</h3>

            <ConfigInput
                label="Number of Villages"
                value={config.numVillages}
                onChange={(v) => onChange('numVillages', v)}
                min={3}
                max={20}
                tooltip="Total villages in the microgrid network"
            />

            <ConfigInput
                label="Hub Battery Capacity (kWh)"
                value={config.averageHubCapacity}
                onChange={(v) => onChange('averageHubCapacity', v)}
                min={200}
                max={1000}
                step={50}
                tooltip="Storage capacity for hub nodes"
            />

            <ConfigInput
                label="Outpost Battery Capacity (kWh)"
                value={config.averageOutpostCapacity}
                onChange={(v) => onChange('averageOutpostCapacity', v)}
                min={100}
                max={500}
                step={50}
                tooltip="Storage capacity for outpost nodes"
            />
        </div>
    );
}

function ChargingConfig({
    config,
    onChange,
}: {
    config: SystemConfig;
    onChange: (key: keyof SystemConfig, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500 ">Charging Strategy</h3>

            <ConfigInput
                label="Daytime Charge Target (%)"
                value={config.dayChargeTarget}
                onChange={(v) => onChange('dayChargeTarget', v)}
                min={50}
                max={100}
                step={5}
                tooltip="Target SOC during solar generation hours"
            />

            <ConfigInput
                label="Nighttime Charge Target (%)"
                value={config.nightChargeTarget}
                onChange={(v) => onChange('nightChargeTarget', v)}
                min={20}
                max={80}
                step={5}
                tooltip="Target SOC during non-generation hours"
            />

            <div className="grid grid-cols-2 gap-4">
                <ConfigInput
                    label="Charge Start Hour"
                    value={config.chargeStartHour}
                    onChange={(v) => onChange('chargeStartHour', v)}
                    min={0}
                    max={23}
                    tooltip="Hour to prioritize charging"
                />

                <ConfigInput
                    label="Charge End Hour"
                    value={config.chargeEndHour}
                    onChange={(v) => onChange('chargeEndHour', v)}
                    min={0}
                    max={23}
                    tooltip="Hour to stop prioritizing charging"
                />
            </div>
        </div>
    );
}

function SolarConfig({
    config,
    onChange,
}: {
    config: SystemConfig;
    onChange: (key: keyof SystemConfig, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500 ">Solar & Weather</h3>

            <ConfigInput
                label="Peak Solar Irradiance (W/m²)"
                value={config.baseSolarIrradiance}
                onChange={(v) => onChange('baseSolarIrradiance', v)}
                min={500}
                max={1500}
                step={50}
                tooltip="Maximum solar radiation at peak hours"
            />

            <ConfigInput
                label="Seasonal Adjustment (%)"
                value={config.seasonalAdjustment}
                onChange={(v) => onChange('seasonalAdjustment', v)}
                min={-50}
                max={50}
                step={5}
                tooltip="Adjust for seasonal solar variations"
            />

            <ConfigInput
                label="Average Cloud Cover (%)"
                value={config.averageCloudCover}
                onChange={(v) => onChange('averageCloudCover', v)}
                min={0}
                max={100}
                step={5}
                tooltip="Default cloud cover percentage"
            />
        </div>
    );
}

function EMSConfig({
    config,
    onChange,
}: {
    config: SystemConfig;
    onChange: (key: keyof SystemConfig, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500 ">Energy Management System</h3>

            <ConfigInput
                label="Critical Threshold (%)"
                value={config.emsCriticalThreshold}
                onChange={(v) => onChange('emsCriticalThreshold', v)}
                min={10}
                max={50}
                step={5}
                tooltip="SOC below this triggers load shedding"
            />

            <ConfigInput
                label="Deficit Threshold (%)"
                value={config.emsDeficitThreshold}
                onChange={(v) => onChange('emsDeficitThreshold', v)}
                min={30}
                max={70}
                step={5}
                tooltip="SOC below this triggers power requests"
            />

            <ConfigInput
                label="Transfer Efficiency (%)"
                value={config.transferEfficiency}
                onChange={(v) => onChange('transferEfficiency', v)}
                min={80}
                max={99}
                step={0.5}
                tooltip="Power transmission efficiency (transmission losses)"
            />

            <ConfigInput
                label="Max Transfer Rate (kW)"
                value={config.maxTransferRate}
                onChange={(v) => onChange('maxTransferRate', v)}
                min={10}
                max={200}
                step={10}
                tooltip="Maximum power that can be transferred at once"
            />
        </div>
    );
}

function BatteryConfig({
    config,
    onChange,
}: {
    config: SystemConfig;
    onChange: (key: keyof SystemConfig, value: any) => void;
}) {
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500 ">Battery Settings</h3>

            <ConfigInput
                label="Max Charge Rate (% per hour)"
                value={config.maxChargeRate}
                onChange={(v) => onChange('maxChargeRate', v)}
                min={0.05}
                max={0.5}
                step={0.05}
                tooltip="Maximum charging speed"
            />

            <ConfigInput
                label="Max Discharge Rate (% per hour)"
                value={config.maxDischargeRate}
                onChange={(v) => onChange('maxDischargeRate', v)}
                min={0.05}
                max={0.5}
                step={0.05}
                tooltip="Maximum discharging speed"
            />

            <ConfigInput
                label="Battery Degradation Rate (% per cycle)"
                value={config.batteryDegradationRate}
                onChange={(v) => onChange('batteryDegradationRate', v)}
                min={0}
                max={1}
                step={0.1}
                tooltip="Battery health degradation per charge cycle"
            />
        </div>
    );
}

const SCENARIOS = [
    { id: 'heatwave', label: 'Heatwave', desc: 'Extreme 45°C temperature', icon: '🔥', color: 'bg-red-600 hover:bg-red-500' },
    { id: 'cloudcover', label: 'Heavy Clouds', desc: '95% cloud coverage', icon: '☁️', color: 'bg-zinc-600 hover:bg-zinc-500' },
    { id: 'hospital-surge', label: 'Hospital Surge', desc: '+100kW demand spike', icon: '🏥', color: 'bg-amber-600 hover:bg-amber-500' },
    { id: 'relay-failure', label: 'Relay Failure', desc: 'Reroute transfers', icon: '⚡', color: 'bg-orange-600 hover:bg-orange-500' },
    { id: 'blackout', label: 'Blackout', desc: 'One village goes offline', icon: '🕯️', color: 'bg-red-800 hover:bg-red-700' },
    { id: 'storm', label: 'Storm', desc: '80 km/h wind, 100% clouds', icon: '🌪️', color: 'bg-violet-600 hover:bg-violet-500' },
];

function ScenarioConfig() {
    const triggerScenario = async (id: string) => {
        try {
            await fetch(`http://localhost:8000/api/scenario/${id}`, { method: 'POST' });
        } catch {}
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500">Trigger Scenarios</h3>
            <p className="text-xs text-zinc-400">Instantly apply predefined events to test grid response</p>
            <div className="grid grid-cols-2 gap-3">
                {SCENARIOS.map((s) => (
                    <button key={s.id} onClick={() => triggerScenario(s.id)}
                        className={`${s.color} text-white rounded-lg p-4 text-left transition`}>
                        <div className="text-lg mb-1">{s.icon}</div>
                        <div className="text-sm font-bold">{s.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SpeedConfig({ config, onChange }: { config: SystemConfig; onChange: (key: keyof SystemConfig, value: any) => void }) {
    const setSpeed = async (speed: number) => {
        try {
            await fetch(`http://localhost:8000/api/control/simulation/speed/${speed}`, { method: 'POST' });
        } catch {}
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-sky-500">Simulation Speed</h3>
            <p className="text-xs text-zinc-400">Control how fast the simulation runs</p>
            <div className="flex gap-2">
                {[0.5, 1, 2, 4].map((s) => (
                    <button key={s} onClick={() => setSpeed(s)}
                        className={`flex-1 py-3 rounded-lg text-sm font-bold transition ${
                            s === 1 ? 'bg-sky-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        }`}>
                        {s}x
                    </button>
                ))}
            </div>
            <p className="text-xs text-zinc-500 text-center">Current: Click a speed button to change</p>
        </div>
    );
}

function ConfigInput({
    label,
    value,
    onChange,
    min,
    max,
    step = 1,
    tooltip,
}: {
    label: string;
    value: number;
    onChange: (value: string) => void;
    min: number;
    max: number;
    step?: number;
    tooltip?: string;
}) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg p-3 rounded">
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-sky-500">{label}</label>
                <span className="text-xs bg-black px-2 py-1 rounded text-emerald-500 font-mono">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan"
            />
            <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>{min}</span>
                <span>{tooltip}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}
