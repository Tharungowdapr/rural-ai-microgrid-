'use client';

import { useState, useCallback } from 'react';
import { useGridStore, Village } from '@/hooks/useGridStore';
import { Plus, X, MapPin, Save, RotateCcw } from 'lucide-react';

const EMPTY_VILLAGE = {
    name: '',
    lat: 23.26,
    lng: 77.41,
    soc: 50,
    solarPanelCapacity: 300,
    maxCapacity: 500,
    chargingRate: 0.1,
    hospitalDemand: 30,
    waterPumpDemand: 20,
    residentialDemand: 50,
    schoolDemand: 25,
    temperature: 28,
};

export default function VillagesPage() {
    const { villages } = useGridStore();
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_VILLAGE });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    const handleCreate = async () => {
        if (!form.name.trim()) { showFeedback('Village name is required'); return; }
        setSaving(true);
        try {
            const res = await fetch('http://localhost:8000/api/villages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const village = await res.json();
                useGridStore.getState().initializeVillages([...villages, village]);
                showFeedback(`${form.name} created at (${form.lat}, ${form.lng})`);
                setForm({ ...EMPTY_VILLAGE });
                setShowAdd(false);
            } else {
                const err = await res.json();
                showFeedback(`Error: ${err.detail || 'Failed to create'}`);
            }
        } catch {
            showFeedback('Failed to connect to backend');
        }
        setSaving(false);
    };

    const handleDelete = async (id: string, name: string) => {
        try {
            const res = await fetch(`http://localhost:8000/api/villages/${id}`, { method: 'DELETE' });
            if (res.ok) {
                const data = await res.json();
                useGridStore.getState().initializeVillages(data.villages);
                showFeedback(`${name} removed`);
            }
        } catch {}
    };

    const handleRefresh = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/villages');
            const data = await res.json();
            if (Array.isArray(data)) useGridStore.getState().initializeVillages(data);
            showFeedback('Refreshed from backend');
        } catch {}
    };

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100">Village Management</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Add, edit, or remove villages in the microgrid network</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh}
                        className="flex items-center gap-1.5 px-3 py-1.5 btn-glass text-xs font-bold text-zinc-300">
                        <RotateCcw size={12} /> Refresh
                    </button>
                    <span className="text-xs text-zinc-500 px-2">{villages.length} online</span>
                    <button onClick={() => setShowAdd(!showAdd)}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition">
                        {showAdd ? <X size={12} /> : <Plus size={12} />}
                        {showAdd ? 'Close' : 'Add Village'}
                    </button>
                </div>
            </div>

            {feedback && (
                <div className="glass-card px-3 py-2 text-xs font-bold text-sky-400">
                    {feedback}
                </div>
            )}

            {showAdd && (
                <AddVillageForm
                    form={form}
                    setForm={setForm}
                    onSave={handleCreate}
                    saving={saving}
                    onCancel={() => setShowAdd(false)}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto">
                {villages.map((v: Village) => (
                    <VillageCard key={v.id} village={v} onDelete={handleDelete} />
                ))}
            </div>
        </div>
    );
}

function AddVillageForm({ form, setForm, onSave, saving, onCancel }: {
    form: typeof EMPTY_VILLAGE;
    setForm: (fn: (prev: typeof EMPTY_VILLAGE) => typeof EMPTY_VILLAGE) => void;
    onSave: () => void;
    saving: boolean;
    onCancel: () => void;
}) {
    const set = (key: string, value: number | string) => setForm(prev => ({ ...prev, [key]: value }));

    return (
        <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
                <MapPin size={16} className="text-sky-400" />
                <h3 className="text-sm font-bold text-zinc-200">Add New Village</h3>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-4">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">Village Name</label>
                    <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                        placeholder="e.g. Sehore, Vidisha, Raisen..."
                        className="w-full glass-input px-3 py-2 text-sm text-zinc-200 font-mono placeholder:text-zinc-600" />
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">Latitude</label>
                    <input type="number" step="0.0001" value={form.lat}
                        onChange={e => set('lat', parseFloat(e.target.value) || 0)}
                        className="w-full glass-input px-3 py-2 text-sm text-zinc-200 font-mono" />
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">Longitude</label>
                    <input type="number" step="0.0001" value={form.lng}
                        onChange={e => set('lng', parseFloat(e.target.value) || 0)}
                        className="w-full glass-input px-3 py-2 text-sm text-zinc-200 font-mono" />
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">Initial SOC (%)</label>
                    <input type="number" min={0} max={100} value={form.soc}
                        onChange={e => set('soc', parseFloat(e.target.value) || 0)}
                        className="w-full glass-input px-3 py-2 text-sm text-zinc-200 font-mono" />
                </div>
                <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wide mb-1 block">Temp (°C)</label>
                    <input type="number" value={form.temperature}
                        onChange={e => set('temperature', parseFloat(e.target.value) || 0)}
                        className="w-full glass-input px-3 py-2 text-sm text-zinc-200 font-mono" />
                </div>
            </div>

            <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Infrastructure Demand (kW)</p>
                <div className="grid grid-cols-4 gap-3">
                    <ConfigSlider label="Hospital" value={form.hospitalDemand} min={0} max={100} step={1}
                        unit="kW" onChange={v => set('hospitalDemand', v)} />
                    <ConfigSlider label="Water Pump" value={form.waterPumpDemand} min={0} max={80} step={1}
                        unit="kW" onChange={v => set('waterPumpDemand', v)} />
                    <ConfigSlider label="Residential" value={form.residentialDemand} min={0} max={150} step={1}
                        unit="kW" onChange={v => set('residentialDemand', v)} />
                    <ConfigSlider label="School" value={form.schoolDemand} min={0} max={80} step={1}
                        unit="kW" onChange={v => set('schoolDemand', v)} />
                </div>
            </div>

            <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-2">Battery & Solar</p>
                <div className="grid grid-cols-4 gap-3">
                    <ConfigSlider label="Panel Capacity" value={form.solarPanelCapacity} min={50} max={1000} step={10}
                        unit="kW" onChange={v => set('solarPanelCapacity', v)} />
                    <ConfigSlider label="Battery Capacity" value={form.maxCapacity} min={100} max={2000} step={50}
                        unit="kWh" onChange={v => set('maxCapacity', v)} />
                    <ConfigSlider label="Charge Rate" value={form.chargingRate * 100} min={1} max={50} step={1}
                        unit="%" onChange={v => set('chargingRate', v / 100)} />
                </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
                <button onClick={onSave} disabled={saving}
                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white text-xs font-bold px-5 py-2 rounded-lg transition">
                    <Save size={12} /> {saving ? 'Creating...' : 'Create Village'}
                </button>
                <button onClick={onCancel}
                    className="flex items-center gap-1.5 btn-glass text-xs font-bold text-zinc-400 px-4 py-2">
                    Cancel
                </button>
                <span className="text-[10px] text-zinc-600 ml-2">
                    Total demand: {(form.hospitalDemand + form.waterPumpDemand + form.residentialDemand + form.schoolDemand).toFixed(0)} kW
                </span>
            </div>
        </div>
    );
}

function ConfigSlider({ label, value, min, max, step, unit, onChange }: {
    label: string; value: number; min: number; max: number; step: number;
    unit: string; onChange: (v: number) => void;
}) {
    return (
        <div className="glass-input p-3">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] text-zinc-400">{label}</span>
                <span className="text-xs font-mono text-sky-400 font-bold">{Math.round(value)}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full" />
        </div>
    );
}

const STATUS_COLORS: Record<string, string> = {
    SURPLUS: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    BALANCED: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    WARNING: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    DEFICIT: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function VillageCard({ village, onDelete }: { village: Village; onDelete: (id: string, name: string) => void }) {
    const updateVillage = useGridStore((s: any) => s.updateVillage);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        soc: village.soc,
        solarPanelCapacity: village.solarPanelCapacity,
        chargingRate: village.chargingRate,
        hospitalDemand: village.hospitalDemand,
        waterPumpDemand: village.waterPumpDemand,
        residentialDemand: village.residentialDemand,
        schoolDemand: village.schoolDemand,
        emergencySpike: village.emergencySpike,
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (key: string, value: number) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`http://localhost:8000/api/villages/${village.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                const updated = await res.json();
                updateVillage(updated);
            }
        } catch {}
        setSaving(false);
        setEditing(false);
    };

    const handleEmergency = async (kw: number) => {
        try {
            await fetch(`http://localhost:8000/api/control/emergency/${village.id}?spike_kw=${kw}`, { method: 'POST' });
            setForm(prev => ({ ...prev, emergencySpike: kw }));
        } catch {}
    };

    const handleShed = async (pct: number) => {
        try {
            await fetch(`http://localhost:8000/api/control/load/${village.id}/shed?percentage=${pct}`, { method: 'POST' });
        } catch {}
    };

    const socColor = village.soc > 70 ? 'text-emerald-400' : village.soc > 40 ? 'text-amber-400' : 'text-red-400';
    const socBarColor = village.soc > 70 ? 'bg-emerald-500' : village.soc > 40 ? 'bg-amber-500' : 'bg-red-500';
    const gen = village.solarGeneration;
    const dem = village.demand;
    const net = gen - dem;

    return (
        <div className="glass-panel overflow-hidden">
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg glass-input flex items-center justify-center">
                        <span className={`text-sm font-bold font-mono ${socColor}`}>{Math.round(village.soc)}%</span>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-zinc-100">{village.name}</h3>
                        <p className="text-[10px] text-zinc-500 font-mono">{village.lat.toFixed(4)}°N {village.lng.toFixed(4)}°E</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${STATUS_COLORS[village.status]}`}>
                        {village.status}
                    </span>
                    <button onClick={() => setEditing(!editing)}
                        className="text-xs text-zinc-400 hover:text-zinc-200 btn-glass px-2 py-1 transition">
                        {editing ? 'Close' : 'Edit'}
                    </button>
                    <button onClick={() => onDelete(village.id, village.name)}
                        className="text-xs text-red-500/60 hover:text-red-400 btn-glass px-2 py-1 transition">
                        Remove
                    </button>
                </div>
            </div>

            <div className="px-4 pb-4 grid grid-cols-4 gap-4">
                <div>
                    <div className="text-[10px] text-zinc-500 mb-1">SOC</div>
                    <div className={`text-lg font-bold font-mono ${socColor}`}>{village.soc.toFixed(1)}%</div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mt-1.5">
                        <div className={`h-full ${socBarColor} rounded-full transition-all`} style={{ width: `${village.soc}%` }} />
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-zinc-500 mb-1">Solar Gen</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{gen.toFixed(0)} kW</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Panel: {village.solarPanelCapacity} kW</div>
                </div>
                <div>
                    <div className="text-[10px] text-zinc-500 mb-1">Demand</div>
                    <div className="text-lg font-bold text-red-400 font-mono">{dem.toFixed(0)} kW</div>
                    <div className={`text-[10px] mt-1 font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        Net: {net >= 0 ? '+' : ''}{net.toFixed(0)} kW
                    </div>
                </div>
                <div>
                    <div className="text-[10px] text-zinc-500 mb-1">Temp</div>
                    <div className="text-lg font-bold text-amber-400 font-mono">{Math.round(village.temperature)}°C</div>
                    <div className="text-[10px] text-zinc-500 mt-1">Freq: {village.frequency.toFixed(1)} Hz</div>
                </div>
            </div>

            {editing && (
                <div className="p-4 border-t border-white/5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <SliderField label="SOC (%)" value={form.soc} min={0} max={100} step={1} unit="%" onChange={v => handleChange('soc', v)} />
                        <SliderField label="Solar Panel (kW)" value={form.solarPanelCapacity} min={0} max={600} step={5} unit=" kW" onChange={v => handleChange('solarPanelCapacity', v)} />
                        <SliderField label="Charge Rate" value={Math.round(form.chargingRate * 100)} min={1} max={25} step={1} unit="%" onChange={v => handleChange('chargingRate', v / 100)} />
                        <SliderField label="Hospital (kW)" value={form.hospitalDemand} min={0} max={100} step={1} unit=" kW" onChange={v => handleChange('hospitalDemand', v)} />
                        <SliderField label="Water Pump (kW)" value={form.waterPumpDemand} min={0} max={80} step={1} unit=" kW" onChange={v => handleChange('waterPumpDemand', v)} />
                        <SliderField label="Residential (kW)" value={form.residentialDemand} min={0} max={150} step={1} unit=" kW" onChange={v => handleChange('residentialDemand', v)} />
                        <SliderField label="School (kW)" value={form.schoolDemand} min={0} max={80} step={1} unit=" kW" onChange={v => handleChange('schoolDemand', v)} />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <button onClick={() => handleEmergency(50)} className="text-xs bg-amber-600/80 hover:bg-amber-500 text-white font-bold px-3 py-1.5 rounded-lg transition">
                                +50 kW Spike
                            </button>
                            <button onClick={() => handleEmergency(100)} className="text-xs bg-red-600/80 hover:bg-red-500 text-white font-bold px-3 py-1.5 rounded-lg transition">
                                +100 kW Spike
                            </button>
                            <button onClick={() => handleEmergency(0)} className="text-xs btn-glass text-zinc-400 px-3 py-1.5 transition">
                                Clear Spike
                            </button>
                            <button onClick={() => handleShed(50)} className="text-xs bg-orange-600/80 hover:bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg transition">
                                Shed 50%
                            </button>
                            <button onClick={() => handleShed(0)} className="text-xs btn-glass text-zinc-400 px-3 py-1.5 transition">
                                Clear Shed
                            </button>
                        </div>
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition">
                            <Save size={12} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SliderField({ label, value, min, max, step, unit, onChange }: {
    label: string; value: number; min: number; max: number; step: number; unit: string;
    onChange: (v: number) => void;
}) {
    return (
        <div className="glass-input p-2">
            <div className="flex justify-between text-[10px] mb-1">
                <span className="text-zinc-400">{label}</span>
                <span className="text-zinc-200 font-mono">{Math.round(value * 100) / 100}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full" />
        </div>
    );
}
