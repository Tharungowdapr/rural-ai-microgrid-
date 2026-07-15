'use client';

import { useState } from 'react';
import { useSystemConfig, SystemConfig } from '@/hooks/useSystemConfig';
import { Settings, Save, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
    const { config, updateConfig, resetConfig } = useSystemConfig();
    const [localConfig, setLocalConfig] = useState(config);
    const [activeTab, setActiveTab] = useState<'city' | 'charging' | 'solar' | 'ems' | 'battery' | 'scenarios' | 'speed'>('city');
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    const handleChange = (key: keyof SystemConfig, value: any) => {
        setLocalConfig((prev: SystemConfig) => ({
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
            showFeedback('Settings saved and applied to all villages');
        } catch {
            showFeedback('Settings saved locally (backend sync failed)');
        }
    };

    const handleReset = () => {
        resetConfig();
        setLocalConfig(useSystemConfig.getState().config);
        showFeedback('Settings reset to defaults');
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

    return (
        <div className="h-full flex flex-col gap-4 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                        <Settings size={20} className="text-sky-500" /> System Configuration
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Global parameters for the microgrid simulation</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReset}
                        className="flex items-center gap-1.5 btn-glass text-xs font-bold text-zinc-300 px-3 py-1.5 transition">
                        <RotateCcw size={12} /> Reset
                    </button>
                    <button onClick={handleSave}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-lg shadow-emerald-500/20">
                        <Save size={12} /> Save & Apply
                    </button>
                </div>
            </div>

            {feedback && (
                <div className="glass-card px-3 py-2 text-xs font-bold text-sky-400">{feedback}</div>
            )}

            <div className="flex gap-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                            activeTab === tab.id
                                ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                                : 'glass-input text-zinc-400 hover:bg-white/5'
                        }`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="glass-panel p-6">
                {activeTab === 'city' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sky-500">City/Grid Configuration</h3>
                        <ConfigInput label="Hub Battery Capacity (kWh)" value={localConfig.averageHubCapacity} onChange={v => handleChange('averageHubCapacity', v)} min={200} max={1000} step={50} tooltip="Storage capacity for hub nodes" />
                        <ConfigInput label="Outpost Battery Capacity (kWh)" value={localConfig.averageOutpostCapacity} onChange={v => handleChange('averageOutpostCapacity', v)} min={100} max={500} step={50} tooltip="Storage capacity for outpost nodes" />
                        <p className="text-[10px] text-zinc-500">Use the Villages page to add or remove villages from the grid.</p>
                    </div>
                )}
                {activeTab === 'charging' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sky-500">Charging Strategy</h3>
                        <ConfigInput label="Daytime Charge Target (%)" value={localConfig.dayChargeTarget} onChange={v => handleChange('dayChargeTarget', v)} min={50} max={100} step={5} tooltip="Target SOC during solar hours" />
                        <ConfigInput label="Nighttime Charge Target (%)" value={localConfig.nightChargeTarget} onChange={v => handleChange('nightChargeTarget', v)} min={20} max={80} step={5} tooltip="Target SOC at night" />
                        <div className="grid grid-cols-2 gap-4">
                            <ConfigInput label="Charge Start Hour" value={localConfig.chargeStartHour} onChange={v => handleChange('chargeStartHour', v)} min={0} max={23} tooltip="Hour to start charging" />
                            <ConfigInput label="Charge End Hour" value={localConfig.chargeEndHour} onChange={v => handleChange('chargeEndHour', v)} min={0} max={23} tooltip="Hour to stop charging" />
                        </div>
                    </div>
                )}
                {activeTab === 'solar' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sky-500">Solar & Weather</h3>
                        <ConfigInput label="Peak Solar Irradiance (W/m\u00B2)" value={localConfig.baseSolarIrradiance} onChange={v => handleChange('baseSolarIrradiance', v)} min={500} max={1500} step={50} tooltip="Max solar radiation at peak" />
                        <ConfigInput label="Seasonal Adjustment (%)" value={localConfig.seasonalAdjustment} onChange={v => handleChange('seasonalAdjustment', v)} min={-50} max={50} step={5} tooltip="Seasonal solar variation" />
                        <ConfigInput label="Average Cloud Cover (%)" value={localConfig.averageCloudCover} onChange={v => handleChange('averageCloudCover', v)} min={0} max={100} step={5} tooltip="Default cloud cover" />
                    </div>
                )}
                {activeTab === 'ems' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sky-500">Energy Management System</h3>
                        <ConfigInput label="Critical Threshold (%)" value={localConfig.emsCriticalThreshold} onChange={v => handleChange('emsCriticalThreshold', v)} min={10} max={50} step={5} tooltip="SOC triggers load shedding" />
                        <ConfigInput label="Deficit Threshold (%)" value={localConfig.emsDeficitThreshold} onChange={v => handleChange('emsDeficitThreshold', v)} min={30} max={70} step={5} tooltip="SOC triggers power requests" />
                        <ConfigInput label="Transfer Efficiency (%)" value={localConfig.transferEfficiency} onChange={v => handleChange('transferEfficiency', v)} min={80} max={99} step={0.5} tooltip="Transmission efficiency" />
                        <ConfigInput label="Max Transfer Rate (kW)" value={localConfig.maxTransferRate} onChange={v => handleChange('maxTransferRate', v)} min={10} max={200} step={10} tooltip="Max power transfer" />
                    </div>
                )}
                {activeTab === 'battery' && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-sky-500">Battery Settings</h3>
                        <ConfigInput label="Max Charge Rate (%/hr)" value={localConfig.maxChargeRate} onChange={v => handleChange('maxChargeRate', v)} min={0.05} max={0.5} step={0.05} tooltip="Max charging speed" />
                        <ConfigInput label="Max Discharge Rate (%/hr)" value={localConfig.maxDischargeRate} onChange={v => handleChange('maxDischargeRate', v)} min={0.05} max={0.5} step={0.05} tooltip="Max discharging speed" />
                        <ConfigInput label="Degradation Rate (%/cycle)" value={localConfig.batteryDegradationRate} onChange={v => handleChange('batteryDegradationRate', v)} min={0} max={1} step={0.1} tooltip="Health loss per cycle" />
                    </div>
                )}
                {activeTab === 'scenarios' && <ScenarioSection />}
                {activeTab === 'speed' && <SpeedSection />}
            </div>
        </div>
    );
}

function ScenarioSection() {
    const [feedback, setFeedback] = useState('');
    const scenarios = [
        { id: 'heatwave', label: 'Heatwave', desc: 'Extreme 45\u00B0C temperature', icon: '\uD83D\uDD25', color: 'bg-red-600/80 hover:bg-red-500' },
        { id: 'cloudcover', label: 'Heavy Clouds', desc: '95% cloud coverage', icon: '\u2601\uFE0F', color: 'bg-zinc-600/80 hover:bg-zinc-500' },
        { id: 'hospital-surge', label: 'Hospital Surge', desc: '+100kW demand spike', icon: '\uD83C\uDFE5', color: 'bg-amber-600/80 hover:bg-amber-500' },
        { id: 'relay-failure', label: 'Relay Failure', desc: 'Reroute transfers', icon: '\u26A1', color: 'bg-orange-600/80 hover:bg-orange-500' },
        { id: 'blackout', label: 'Blackout', desc: 'One village goes offline', icon: '\uD83D\uDD6F\uFE0F', color: 'bg-red-800/80 hover:bg-red-700' },
        { id: 'storm', label: 'Storm', desc: '80 km/h wind, 100% clouds', icon: '\uD83C\uDF2A\uFE0F', color: 'bg-violet-600/80 hover:bg-violet-500' },
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-500">Trigger Scenarios</h3>
            <p className="text-xs text-zinc-400">Apply predefined events to test grid response</p>
            {feedback && <div className="glass-card text-emerald-400 text-xs font-bold px-3 py-2">{feedback}</div>}
            <div className="grid grid-cols-3 gap-3">
                {scenarios.map(s => (
                    <button key={s.id} onClick={async () => {
                        try {
                            await fetch(`http://localhost:8000/api/scenario/${s.id}`, { method: 'POST' });
                            setFeedback(`${s.label} triggered`);
                            setTimeout(() => setFeedback(''), 2500);
                        } catch {}
                    }} className={`${s.color} text-white rounded-xl p-4 text-left transition shadow-lg`}>
                        <div className="text-lg mb-1">{s.icon}</div>
                        <div className="text-sm font-bold">{s.label}</div>
                        <div className="text-[10px] opacity-80 mt-0.5">{s.desc}</div>
                    </button>
                ))}
            </div>
        </div>
    );
}

function SpeedSection() {
    const [feedback, setFeedback] = useState('');

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-sky-500">Simulation Speed</h3>
            <p className="text-xs text-zinc-400">Control how fast the simulation runs</p>
            {feedback && <div className="glass-card text-emerald-400 text-xs font-bold px-3 py-2">{feedback}</div>}
            <div className="flex gap-3">
                {[0.5, 1, 2, 4].map(s => (
                    <button key={s} onClick={async () => {
                        try {
                            await fetch(`http://localhost:8000/api/control/simulation/speed/${s}`, { method: 'POST' });
                            setFeedback(`Speed set to ${s}x`);
                            setTimeout(() => setFeedback(''), 2500);
                        } catch {}
                    }} className="flex-1 py-4 rounded-xl text-lg font-bold transition glass-input text-zinc-300 hover:bg-white/5">
                        {s}x
                    </button>
                ))}
            </div>
        </div>
    );
}

function ConfigInput({ label, value, onChange, min, max, step = 1, tooltip }: {
    label: string; value: number; onChange: (value: string) => void;
    min: number; max: number; step?: number; tooltip?: string;
}) {
    return (
        <div className="glass-input p-4">
            <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-300">{label}</label>
                <span className="text-xs bg-white/5 px-2 py-1 rounded-lg text-emerald-400 font-mono">
                    {typeof value === 'number' ? (Number.isInteger(step) ? value : value.toFixed(2)) : value}
                </span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full" />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                <span>{min}</span>
                <span>{tooltip}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}
