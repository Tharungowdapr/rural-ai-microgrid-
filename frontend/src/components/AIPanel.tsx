'use client';

import { useEffect, useState } from 'react';
import { useGridStore } from '@/hooks/useGridStore';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, AlertTriangle, TrendingDown } from 'lucide-react';

export default function AIPanel() {
    const { forecasts } = useGridStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Generate sample forecast data if empty
    const data = forecasts.length > 0
        ? forecasts.map((f) => ({
            time: new Date(f.timestamp).getHours(),
            demand: f.demand,
            generation: f.generation,
        }))
        : Array.from({ length: 12 }, (_, i) => ({
            time: i,
            demand: 150 + (i * 15),
            generation: 180 + (i * 10),
        }));

    return (
        <div className="h-full flex flex-col gap-3">
            {/* AI Header */}
            <div className="flex items-center gap-2">
                <Brain size={18} className="text-ai-purple glow-text-strong" />
                <h3 className="text-sm font-bold font-orbitron text-ai-purple glow-text">
                    AI GRID INTELLIGENCE
                </h3>
                <div className="ml-auto">
                    <span className="text-xs bg-ai-purple bg-opacity-20 text-ai-purple px-2 py-1 rounded">
                        LSTM ACTIVE
                    </span>
                </div>
            </div>

            {/* Confidence Indicator */}
            <div className="glass-card p-2 rounded text-xs">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">Prediction Confidence</span>
                    <span className="text-neon-green font-bold">92%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                        className="h-full bg-gradient-to-r from-ai-purple to-neon-green rounded-full"
                        style={{ width: '92%' }}
                    />
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="flex-1 bg-darker-blue rounded p-2">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                        <XAxis
                            dataKey="time"
                            stroke="rgba(0, 212, 255, 0.3)"
                            style={{ fontSize: '10px' }}
                        />
                        <YAxis stroke="rgba(0, 212, 255, 0.3)" style={{ fontSize: '10px' }} />
                        <Line
                            type="monotone"
                            dataKey="demand"
                            stroke="#ffa500"
                            dot={false}
                            isAnimationActive={false}
                            strokeWidth={2}
                        />
                        <Line
                            type="monotone"
                            dataKey="generation"
                            stroke="#00ff41"
                            dot={false}
                            isAnimationActive={false}
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* AI Insights */}
            <div className="space-y-2">
                <div className="glass-card p-2 rounded text-xs border-l-2 border-neon-green">
                    <div className="flex gap-1 items-start">
                        <TrendingDown size={14} className="text-neon-green flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-neon-green">Generation Trend</p>
                            <p className="text-gray-300">Increasing through afternoon peak</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-2 rounded text-xs border-l-2 border-critical-red">
                    <div className="flex gap-1 items-start">
                        <AlertTriangle size={14} className="text-critical-red flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold text-critical-red">Next Deficit</p>
                            <p className="text-gray-300">Village-06 in 2.1 hours</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Model Info */}
            <div className="text-xs text-gray-500 border-t border-cyan border-opacity-20 pt-2">
                <p>Model: LSTM (6-hour window)</p>
                <p>Last Updated: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}</p>
            </div>
        </div>
    );
}
