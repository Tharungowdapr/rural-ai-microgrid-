'use client';

import { useState, useCallback } from 'react';
import { Cloud, Wind, Sun, Clock, Thermometer, Droplets, Send } from 'lucide-react';
import { useGridStore } from '@/hooks/useGridStore';

const CONDITIONS = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'storm'];

export default function WeatherPage() {
    const {
        weatherCondition, weatherTemperature, weatherCloudCover,
        weatherWindSpeed, weatherHumidity, simulationHour,
    } = useGridStore();

    const [temperature, setTemperature] = useState(weatherTemperature);
    const [cloudCover, setCloudCover] = useState(weatherCloudCover);
    const [windSpeed, setWindSpeed] = useState(weatherWindSpeed);
    const [humidity, setHumidity] = useState(weatherHumidity);
    const [dayTimeHour, setDayTimeHour] = useState(simulationHour);
    const [condition, setCondition] = useState(weatherCondition);
    const [irradiance, setIrradiance] = useState(1000);
    const [feedback, setFeedback] = useState('');

    const showFeedback = (msg: string) => {
        setFeedback(msg);
        setTimeout(() => setFeedback(''), 2500);
    };

    const applyWeather = useCallback(async () => {
        try {
            await fetch('http://localhost:8000/api/weather', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    temperature, cloudCover, windSpeed, humidity,
                    dayTimeHour, condition, irradiance,
                }),
            });
            showFeedback('Weather parameters applied');
        } catch { showFeedback('Failed to apply weather'); }
    }, [temperature, cloudCover, windSpeed, humidity, dayTimeHour, condition, irradiance]);

    return (
        <div className="h-full flex flex-col gap-6 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100">Weather & Environment</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">Control global weather parameters affecting solar generation</p>
                </div>
                <button onClick={applyWeather}
                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-lg shadow-sky-500/20">
                    <Send size={12} /> Apply Weather
                </button>
            </div>

            {feedback && (
                <div className="glass-card px-3 py-2 text-xs font-bold text-sky-400">{feedback}</div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div className="glass-panel p-6 space-y-6">
                    <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                        <Sun size={16} className="text-amber-500" /> Solar Conditions
                    </h3>

                    <WeatherSlider
                        icon={<Thermometer size={14} />}
                        label="Temperature" value={temperature} min={-10} max={50} step={1} unit="\u00B0C"
                        color="text-amber-400" onChange={setTemperature}
                    />

                    <WeatherSlider
                        icon={<Cloud size={14} />}
                        label="Cloud Cover" value={cloudCover} min={0} max={100} step={1} unit="%"
                        color="text-zinc-400" onChange={setCloudCover}
                    />

                    <WeatherSlider
                        icon={<Sun size={14} />}
                        label="Solar Irradiance" value={irradiance} min={0} max={1500} step={10} unit=" W/m\u00B2"
                        color="text-amber-400" onChange={setIrradiance}
                    />

                    <div>
                        <label className="text-xs text-zinc-400 block mb-2">Weather Condition</label>
                        <div className="grid grid-cols-5 gap-2">
                            {CONDITIONS.map(c => (
                                <button key={c} onClick={() => setCondition(c)}
                                    className={`text-xs py-2 rounded-xl font-bold transition ${
                                        condition === c
                                            ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20'
                                            : 'glass-input text-zinc-400 hover:bg-white/5'
                                    }`}>
                                    {c.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-6 space-y-6">
                    <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                        <Wind size={16} className="text-sky-500" /> Atmosphere
                    </h3>

                    <WeatherSlider
                        icon={<Wind size={14} />}
                        label="Wind Speed" value={windSpeed} min={0} max={150} step={1} unit=" km/h"
                        color="text-sky-400" onChange={setWindSpeed}
                    />

                    <WeatherSlider
                        icon={<Droplets size={14} />}
                        label="Humidity" value={humidity} min={0} max={100} step={1} unit="%"
                        color="text-blue-400" onChange={setHumidity}
                    />

                    <WeatherSlider
                        icon={<Clock size={14} />}
                        label="Time of Day" value={dayTimeHour} min={0} max={23} step={1} unit=":00"
                        color="text-violet-400" onChange={setDayTimeHour}
                    />

                    <div className="glass-input p-4 space-y-2">
                        <h4 className="text-xs font-bold text-zinc-300">Conditions Summary</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between"><span className="text-zinc-500">Condition</span><span className="text-zinc-200">{condition.replace('_', ' ')}</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Temperature</span><span className="text-amber-400 font-mono">{temperature}\u00B0C</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Cloud Cover</span><span className="text-zinc-300 font-mono">{cloudCover}%</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Irradiance</span><span className="text-amber-400 font-mono">{irradiance} W/m\u00B2</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Wind</span><span className="text-sky-400 font-mono">{windSpeed} km/h</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Humidity</span><span className="text-blue-400 font-mono">{humidity}%</span></div>
                            <div className="flex justify-between"><span className="text-zinc-500">Hour</span><span className="text-violet-400 font-mono">{dayTimeHour}:00</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function WeatherSlider({ icon, label, value, min, max, step, unit, color, onChange }: {
    icon: React.ReactNode; label: string; value: number; min: number; max: number; step: number;
    unit: string; color: string; onChange: (v: number) => void;
}) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                    <span className={color}>{icon}</span>
                    <span className="text-xs text-zinc-300">{label}</span>
                </div>
                <span className={`text-sm font-bold font-mono ${color}`}>{value}{unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(Number(e.target.value))}
                className="w-full h-1.5" />
        </div>
    );
}
