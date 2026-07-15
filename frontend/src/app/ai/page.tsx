'use client';

import { useState } from 'react';
import { useGridStore, AIInsight } from '@/hooks/useGridStore';
import { Brain, Cpu, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function AIPage() {
    const { forecasts, ai_insights, updateForecasts, setAIInsights } = useGridStore();
    const [loading, setLoading] = useState(false);
    const [modelMetrics, setModelMetrics] = useState<any>(null);

    const handlePredict = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:8000/api/forecast');
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                updateForecasts(data);
                const source = data[0].source || 'unknown';
                setAIInsights([
                    { type: 'info', title: 'Forecast Complete', content: `${source === 'model' ? 'LSTM model' : 'Heuristic'}: 6-hour prediction loaded (conf: ${(data[0].confidence * 100).toFixed(0)}%)`, severity: 1 },
                    { type: 'trend', title: 'Demand Trend', content: data[0].demand > data[data.length - 1].demand ? 'Demand rising \u2014 prepare for peak' : 'Demand stable', severity: 2 },
                ]);
            }
        } catch {}
        setLoading(false);
    };

    const loadModelMetrics = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/metrics/model');
            const data = await res.json();
            setModelMetrics(data);
        } catch {}
    };

    const rawForecasts = forecasts as any[];
    const hasData = rawForecasts.length > 0;
    const forecastSource = hasData ? rawForecasts[0].source || 'unknown' : null;
    const avgConfidence = hasData
        ? rawForecasts.reduce((s: number, f: any) => s + f.confidence, 0) / rawForecasts.length
        : 0;

    const chartData = rawForecasts.map((f: any, i: number) => ({
        time: `+${i + 1}h`,
        demand: f.demand,
        generation: f.generation,
        confidence: (f.confidence * 100).toFixed(0),
    }));

    return (
        <div className="h-full flex flex-col gap-5 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-zinc-100">AI Grid Intelligence</h2>
                    <p className="text-xs text-zinc-500 mt-0.5">LSTM-powered demand forecasting and grid insights</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={loadModelMetrics}
                        className="flex items-center gap-1.5 btn-glass text-zinc-200 text-xs font-bold px-3 py-1.5 transition">
                        <BarChart3 size={12} /> Load Metrics
                    </button>
                    <button onClick={handlePredict} disabled={loading}
                        className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition shadow-lg shadow-violet-500/20">
                        <Brain size={14} />
                        {loading ? 'Predicting...' : 'Predict Load'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="glass-panel p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Cpu size={16} className={forecastSource === 'model' ? 'text-emerald-500' : 'text-amber-500'} />
                        <h3 className="text-sm font-bold text-zinc-200">Model Status</h3>
                    </div>
                    {forecastSource ? (
                        <div className={`text-xs font-bold px-3 py-2 rounded-lg border ${
                            forecastSource === 'model'
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                                : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                        }`}>
                            {forecastSource === 'model' ? 'LSTM Model Active' : 'Heuristic Fallback'}
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500">No model loaded yet</p>
                    )}
                    <div className="mt-3 text-[10px] text-zinc-500 space-y-1">
                        <p>Architecture: LSTM (96-step, 13 features)</p>
                        <p>Hidden: 64 \u2192 32 \u2192 Dense(1)</p>
                    </div>
                </div>

                <div className="glass-panel p-5">
                    <h3 className="text-sm font-bold text-zinc-200 mb-3">Prediction Confidence</h3>
                    {hasData ? (
                        <>
                            <div className="text-3xl font-bold text-zinc-100 mb-2 font-mono">
                                {(avgConfidence * 100).toFixed(0)}%
                            </div>
                            <div className="w-full bg-white/5 rounded-full h-2">
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${avgConfidence * 100}%`,
                                        backgroundColor: avgConfidence > 0.85 ? '#10b981' : avgConfidence > 0.7 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">
                                {avgConfidence > 0.85 ? 'High confidence' : avgConfidence > 0.7 ? 'Moderate confidence' : 'Low confidence'}
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-zinc-500">Run a prediction to see confidence</p>
                    )}
                </div>

                <div className="glass-panel p-5">
                    <h3 className="text-sm font-bold text-zinc-200 mb-3">Training Metrics</h3>
                    {modelMetrics ? (
                        <div className="space-y-2">
                            {[
                                ['MAE', modelMetrics.mae?.toFixed(2)],
                                ['RMSE', modelMetrics.rmse?.toFixed(2)],
                                ['MAPE', `${modelMetrics.mape?.toFixed(2)}%`],
                                ['Train', modelMetrics.train_size?.toLocaleString()],
                                ['Test', modelMetrics.test_size?.toLocaleString()],
                                ['Epochs', modelMetrics.epochs_trained],
                            ].map(([label, val]) => (
                                <div key={label} className="flex justify-between text-xs">
                                    <span className="text-zinc-500">{label}</span>
                                    <span className="font-mono text-zinc-200">{val}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-zinc-500">Click Load Metrics to fetch training data</p>
                    )}
                </div>
            </div>

            <div className="glass-panel p-5">
                <h3 className="text-sm font-bold text-zinc-200 mb-3">6-Hour Forecast</h3>
                {hasData ? (
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" style={{ fontSize: 11 }} />
                                <YAxis stroke="rgba(255,255,255,0.2)" style={{ fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(18,18,28,0.9)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 11, backdropFilter: 'blur(12px)' }}
                                    labelStyle={{ color: '#999' }}
                                />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="demand" stroke="#ffa500" dot={{ r: 3 }} strokeWidth={2} name="Demand (kW)" />
                                <Line type="monotone" dataKey="generation" stroke="#00ff41" dot={{ r: 3 }} strokeWidth={2} name="Generation (kW)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[280px] flex items-center justify-center">
                        <div className="text-center">
                            <Brain size={32} className="text-zinc-600 mx-auto mb-3" />
                            <p className="text-sm text-zinc-400">No predictions yet</p>
                            <p className="text-xs text-zinc-600 mt-1">Click Predict Load to run a 6-hour forecast</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="glass-panel p-5">
                <h3 className="text-sm font-bold text-zinc-200 mb-3">AI Insights</h3>
                {ai_insights.length > 0 ? (
                    <div className="space-y-2">
                        {ai_insights.map((insight: AIInsight, idx: number) => (
                            <div key={idx}
                                className={`glass-input p-3 text-xs border-l-2 ${
                                    insight.type === 'alert' ? 'border-red-500' :
                                    insight.type === 'trend' ? 'border-emerald-500' : 'border-violet-500'
                                }`}>
                                <div className="flex gap-2 items-start">
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
                                        }`}>{insight.title}</p>
                                        <p className="text-gray-300 mt-0.5">{insight.content}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-zinc-500 text-center py-4">No insights yet \u2014 run a prediction first</p>
                )}
            </div>
        </div>
    );
}
