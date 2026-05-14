'use client';

import { useEffect, useState } from 'react';
import { useGridStore } from '@/hooks/useGridStore';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Brain, AlertTriangle, TrendingDown, MousePointer } from 'lucide-react';

export default function AIPanel() {
    const { forecasts, ai_insights } = useGridStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const hasData = forecasts.length > 0;

    return (
        <div className="h-full flex flex-col gap-3">
            {/* AI Header */}
            <div className="flex items-center gap-2">
                <Brain size={18} className="text-violet-500" />
                <h3 className="text-sm font-bold text-violet-500">
                    AI GRID INTELLIGENCE
                </h3>
                <div className="ml-auto">
                    <span className="text-xs data-pill text-primary bg-primary/20 border-primary/30 px-2 py-1 rounded">
                        LSTM ACTIVE
                    </span>
                </div>
            </div>

            {/* Confidence Indicator */}
            <div className="bg-background/80 border border-outline-variant rounded-lg shadow-inner p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-outline">Prediction Confidence</span>
                    <span className="text-emerald-500 font-bold">92%</span>
                </div>
                <div className="w-full bg-[#1F1F1F] rounded-full h-1.5">
                    <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: '92%' }}
                    />
                </div>
            </div>

            {/* Forecast Chart */}
            <div className="flex-1 bg-[#1F1F1F]/50 rounded p-2 flex items-center justify-center">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={forecasts.map((f, i) => ({
                            time: `+${i + 1}h`,
                            demand: f.demand,
                            generation: f.generation,
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.1)" />
                            <XAxis dataKey="time" stroke="rgba(0,212,255,0.3)" style={{ fontSize: 10 }} />
                            <YAxis stroke="rgba(0,212,255,0.3)" style={{ fontSize: 10 }} />
                            <Line type="monotone" dataKey="demand" stroke="#ffa500" dot={false} isAnimationActive={false} strokeWidth={2} />
                            <Line type="monotone" dataKey="generation" stroke="#00ff41" dot={false} isAnimationActive={false} strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center">
                        <MousePointer size={24} className="text-zinc-600 mx-auto mb-2" />
                        <p className="text-xs text-zinc-500">No predictions yet</p>
                        <p className="text-[10px] text-zinc-600 mt-1">Press <span className="text-violet-400 font-bold">Predict Load</span> to run LSTM forecast</p>
                    </div>
                )}
            </div>

            {/* AI Insights */}
            <div className="space-y-2">
                {ai_insights.length > 0 ? (
                    ai_insights.map((insight, idx) => (
                        <div 
                            key={idx} 
                            className={`bg-background/80 border border-outline-variant rounded-lg shadow-inner p-2 text-xs border-l-2 ${
                                insight.type === 'alert' ? 'border-red-500' : 
                                insight.type === 'trend' ? 'border-emerald-500' : 'border-violet-500'
                            }`}
                        >
                            <div className="flex gap-1 items-start">
                                {insight.type === 'alert' ? (
                                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                                ) : insight.type === 'trend' ? (
                                    <TrendingDown size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                ) : (
                                    <Brain size={14} className="text-violet-500 flex-shrink-0 mt-0.5" />
                                )}
                                <div>
                                    <p className={`font-bold ${
                                        insight.type === 'alert' ? 'text-red-500' : 
                                        insight.type === 'trend' ? 'text-emerald-500' : 'text-violet-500'
                                    }`}>
                                        {insight.title}
                                    </p>
                                    <p className="text-gray-300">{insight.content}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-background/80 border border-outline-variant rounded-lg shadow-inner p-2 text-xs border-l-2 border-outline opacity-50">
                        <p className="text-outline">Waiting for AI initialization...</p>
                    </div>
                )}
            </div>

            {/* Model Info */}
            <div className="text-xs text-outline border-t border-outline-variant pt-2">
                <p>Model: LSTM (6-hour window)</p>
                <p>Last Updated: {mounted ? new Date().toLocaleTimeString() : '--:--:--'}</p>
            </div>
        </div>
    );
}
