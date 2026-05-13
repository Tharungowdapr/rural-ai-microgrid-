'use client';

import { Cloud, Wind, Droplets, Sun } from 'lucide-react';

export default function WeatherPanel() {
    // Demo weather data - would be updated from backend
    const weather = {
        condition: 'Partly Cloudy',
        temperature: 28,
        humidity: 65,
        windSpeed: 12,
        cloudCover: 35,
        irradiance: 850, // W/m²
        visibility: 10,
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold font-orbitron text-cyan glow-text">
                WEATHER CONDITIONS
            </h3>

            {/* Main Weather Card */}
            <div className="glass-card p-2 rounded">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Sun size={14} className="text-amber" />
                        <span className="text-xs font-bold">{weather.condition}</span>
                    </div>
                    <span className="text-sm font-bold text-amber">{weather.temperature}°C</span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-darker-blue rounded p-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Droplets size={12} className="text-cyan" />
                            <span className="text-xs text-gray-400">Humidity</span>
                        </div>
                        <p className="text-xs font-bold text-cyan">{weather.humidity}%</p>
                    </div>

                    <div className="bg-darker-blue rounded p-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Wind size={12} className="text-neon-green" />
                            <span className="text-xs text-gray-400">Wind</span>
                        </div>
                        <p className="text-xs font-bold text-neon-green">{weather.windSpeed} km/h</p>
                    </div>

                    <div className="bg-darker-blue rounded p-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Sun size={12} className="text-amber" />
                            <span className="text-xs text-gray-400">Irradiance</span>
                        </div>
                        <p className="text-xs font-bold text-amber">{weather.irradiance} W/m²</p>
                    </div>

                    <div className="bg-darker-blue rounded p-1.5">
                        <div className="flex items-center gap-1 mb-0.5">
                            <Cloud size={12} className="text-cyan" />
                            <span className="text-xs text-gray-400">Cloud Cover</span>
                        </div>
                        <p className="text-xs font-bold text-cyan">{weather.cloudCover}%</p>
                    </div>
                </div>
            </div>

            {/* Solar Impact */}
            <div className="glass-card p-2 rounded text-xs border-l-2 border-neon-green">
                <p className="text-gray-400 mb-1">Solar Impact</p>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                        className="h-full bg-gradient-to-r from-amber to-neon-green rounded-full"
                        style={{ width: '85%' }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">Optimal generation conditions</p>
            </div>
        </div>
    );
}
