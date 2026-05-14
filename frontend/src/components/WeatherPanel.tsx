'use client';

import { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, Sun, Clock } from 'lucide-react';

export default function WeatherPanel() {
    const [temperature, setTemperature] = useState(25);
    const [cloudCover, setCloudCover] = useState(30);
    const [windSpeed, setWindSpeed] = useState(10);
    const [dayTimeHour, setDayTimeHour] = useState(12);

    const updateWeather = async (params: any) => {
        try {
            await fetch('http://localhost:8000/api/weather', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
            });
        } catch (error) {
            console.error('Failed to update weather', error);
        }
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-bold text-outline uppercase tracking-wider">
                Global Environment Controls
            </h3>

            <div className="space-y-4 pt-2">
                
                {/* Time of Day */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1 text-on-surface">
                            <Clock size={14} />
                            <span className="text-sm font-medium">Time of Day</span>
                        </div>
                        <span className="text-sm font-bold text-primary font-mono">{dayTimeHour}:00</span>
                    </div>
                    <input 
                        type="range" min="0" max="23" 
                        value={dayTimeHour}
                        onChange={(e) => {
                            setDayTimeHour(Number(e.target.value));
                            updateWeather({ dayTimeHour: Number(e.target.value) });
                        }}
                        className="w-full"
                    />
                </div>

                {/* Temperature */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1 text-on-surface">
                            <Sun size={14} />
                            <span className="text-sm font-medium">Temperature</span>
                        </div>
                        <span className="text-sm font-bold text-tertiary font-mono">{temperature}°C</span>
                    </div>
                    <input 
                        type="range" min="-10" max="50" 
                        value={temperature}
                        onChange={(e) => {
                            setTemperature(Number(e.target.value));
                            updateWeather({ temperature: Number(e.target.value) });
                        }}
                        className="w-full accent-amber-500"
                    />
                </div>

                {/* Cloud Cover */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1 text-on-surface">
                            <Cloud size={14} />
                            <span className="text-sm font-medium">Cloud Cover</span>
                        </div>
                        <span className="text-sm font-bold text-outline">{cloudCover}%</span>
                    </div>
                    <input 
                        type="range" min="0" max="100" 
                        value={cloudCover}
                        onChange={(e) => {
                            setCloudCover(Number(e.target.value));
                            updateWeather({ cloudCover: Number(e.target.value) });
                        }}
                        className="w-full accent-slate-400"
                    />
                </div>

                {/* Wind Speed */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1 text-on-surface">
                            <Wind size={14} />
                            <span className="text-sm font-medium">Wind Speed</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-500">{windSpeed} km/h</span>
                    </div>
                    <input 
                        type="range" min="0" max="150" 
                        value={windSpeed}
                        onChange={(e) => {
                            setWindSpeed(Number(e.target.value));
                            updateWeather({ windSpeed: Number(e.target.value) });
                        }}
                        className="w-full accent-emerald-500"
                    />
                </div>
            </div>
        </div>
    );
}
