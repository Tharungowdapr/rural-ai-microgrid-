// @ts-nocheck
'use client';
import { useState, useEffect } from 'react';
import { useGridStore, Village } from '@/hooks/useGridStore';

interface CityControlModalProps {
    village: Village | null;
    onClose: () => void;
}

const CONDITIONS = ["sunny", "partly_cloudy", "cloudy", "rainy", "storm"];

export default function CityControlModal({ village, onClose }: CityControlModalProps) {
    const updateVillage = useGridStore((s) => s.updateVillage);
    const [soc, setSoc] = useState(50);
    const [temperature, setTemperature] = useState(25);
    const [cloudCover, setCloudCover] = useState(30);
    const [condition, setCondition] = useState("partly_cloudy");
    const [chargingRate, setChargingRate] = useState(0.1);
    const [solarPanelCapacity, setSolarPanelCapacity] = useState(300);
    const [hospitalDemand, setHospitalDemand] = useState(30);
    const [waterPumpDemand, setWaterPumpDemand] = useState(20);
    const [residentialDemand, setResidentialDemand] = useState(50);
    const [schoolDemand, setSchoolDemand] = useState(25);
    const [emergencySpike, setEmergencySpike] = useState(0);

    useEffect(() => {
        if (village) {
            setSoc(village.soc);
            setTemperature(village.temperature);
            setCloudCover(30);
            setCondition("partly_cloudy");
            setChargingRate(village.chargingRate || 0.1);
            setSolarPanelCapacity(village.solarPanelCapacity || 300);
            setHospitalDemand(village.hospitalDemand ?? 30);
            setWaterPumpDemand(village.waterPumpDemand ?? 20);
            setResidentialDemand(village.residentialDemand ?? 50);
            setSchoolDemand(village.schoolDemand ?? 25);
            setEmergencySpike(village.emergencySpike || 0);
        }
    }, [village]);

    if (!village) return null;

    const save = async (extra: Record<string, unknown> = {}) => {
        const body = {
            soc: Number(soc),
            temperature: Number(temperature),
            chargingRate: Number(chargingRate),
            solarPanelCapacity: Number(solarPanelCapacity),
            hospitalDemand: Number(hospitalDemand),
            waterPumpDemand: Number(waterPumpDemand),
            residentialDemand: Number(residentialDemand),
            schoolDemand: Number(schoolDemand),
            emergencySpike: Number(emergencySpike),
            ...extra,
        };
        await fetch(`http://localhost:8000/api/villages/${village.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
    };

    const handleSave = async () => {
        await fetch(`http://localhost:8000/api/weather`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ condition, cloudCover: Number(cloudCover) }),
        });
        await save();
        // Refresh from backend to get computed values (demand, gen, etc.)
        const res = await fetch(`http://localhost:8000/api/villages/${village.id}`);
        if (res.ok) {
            const updated = await res.json();
            updateVillage(updated);
        }
        onClose();
    };

    const handleRandomize = async () => {
        await fetch('http://localhost:8000/api/simulation/randomize', { method: 'POST' });
        onClose();
    };

    const triggerEmergency = async (kw: number) => {
        setEmergencySpike(kw);
        await fetch(`http://localhost:8000/api/control/emergency/${village.id}?spike_kw=${kw}`, { method: 'POST' });
    };

    const slider = (label: string, value: number, set: (v: number) => void, min: number, max: number, step = 1, unit = "") => (
        <div>
            <div className="flex justify-between text-xs"><span className="text-zinc-400">{label}</span><span className="text-zinc-200 font-mono">{value}{unit}</span></div>
            <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="w-full accent-sky-500" />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-100">{village.name}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 text-xl leading-none">&times;</button>
                </div>

                <div className="p-4 space-y-4">
                    <div>
                        <h3 className="text-sm font-bold text-sky-500 mb-2 uppercase tracking-wide">Weather</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-zinc-400 block mb-1">Condition</label>
                                <select value={condition} onChange={e => setCondition(e.target.value)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-200">
                                    {CONDITIONS.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                                </select>
                            </div>
                            {slider("Cloud Cover", cloudCover, setCloudCover, 0, 100, 1, "%")}
                        </div>
                        {slider("Temperature", temperature, setTemperature, -5, 45, 1, "°C")}
                    </div>

                    <hr className="border-zinc-800" />

                    <div>
                        <h3 className="text-sm font-bold text-emerald-500 mb-2 uppercase tracking-wide">Battery & Solar</h3>
                        {slider("State of Charge", soc, setSoc, 0, 100, 1, "%")}
                        {slider("Solar Panel Capacity", solarPanelCapacity, setSolarPanelCapacity, 0, 500, 5, " kW")}
                        {slider("Charge Rate", Math.round(chargingRate * 100), v => setChargingRate(v / 100), 1, 25, 1, "%")}
                    </div>

                    <hr className="border-zinc-800" />

                    <div>
                        <h3 className="text-sm font-bold text-amber-500 mb-2 uppercase tracking-wide">Infrastructure Loads</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            {slider("Hospital", hospitalDemand, setHospitalDemand, 0, 100, 1, " kW")}
                            {slider("Water Pump", waterPumpDemand, setWaterPumpDemand, 0, 80, 1, " kW")}
                            {slider("Residential", residentialDemand, setResidentialDemand, 0, 150, 1, " kW")}
                            {slider("School", schoolDemand, setSchoolDemand, 0, 80, 1, " kW")}
                        </div>
                    </div>

                    <hr className="border-zinc-800" />

                    <div>
                        <h3 className="text-sm font-bold text-red-500 mb-2 uppercase tracking-wide">Emergency</h3>
                        <div className="flex gap-2">
                            <button onClick={() => triggerEmergency(50)}
                                className="flex-1 text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded transition">
                                +50 kW Spike
                            </button>
                            <button onClick={() => triggerEmergency(100)}
                                className="flex-1 text-xs bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded transition">
                                +100 kW Spike
                            </button>
                            <button onClick={() => triggerEmergency(0)}
                                className="flex-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-white py-2 rounded transition">
                                Clear
                            </button>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-4 flex justify-end gap-2">
                    <button onClick={handleRandomize}
                        className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition">
                        Randomize
                    </button>
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition">
                        Cancel
                    </button>
                    <button onClick={handleSave}
                        className="px-4 py-2 text-sm bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg transition">
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
