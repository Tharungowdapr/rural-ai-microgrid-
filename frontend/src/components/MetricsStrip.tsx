'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { Battery, Zap, AlertTriangle, TrendingUp, Activity, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MetricsStrip() {
    const { totalGeneration, totalDemand, gridStability, activeTransfers, alerts } =
        useGridStore();

    const netBalance = totalGeneration - totalDemand;

    const cards = [
        {
            title: 'Total Energy Generated',
            value: `${totalGeneration.toFixed(2)} MW`,
            icon: Zap,
            color: 'text-neon-green',
            trend: '+2.4%',
        },
        {
            title: 'Total Consumption',
            value: `${totalDemand.toFixed(2)} MW`,
            icon: Activity,
            color: 'text-cyan',
            trend: '-0.8%',
        },
        {
            title: 'Net Grid Balance',
            value: `${netBalance.toFixed(2)} MW`,
            icon: TrendingUp,
            color: netBalance > 0 ? 'text-neon-green' : 'text-critical-red',
            trend: netBalance > 0 ? 'Surplus' : 'Deficit',
        },
        {
            title: 'AI Prediction Confidence',
            value: '92%',
            icon: Radio,
            color: 'text-ai-purple',
            trend: 'LSTM Active',
        },
        {
            title: 'Active P2P Transfers',
            value: activeTransfers.toString(),
            icon: Battery,
            color: 'text-amber',
            trend: 'In Progress',
        },
        {
            title: 'Emergency Alerts',
            value: alerts.filter((a) => a.type === 'CRITICAL').length.toString(),
            icon: AlertTriangle,
            color: alerts.length > 0 ? 'text-critical-red' : 'text-neon-green',
            trend: `${alerts.length} Total`,
        },
    ];

    return (
        <div className="px-4 py-3 border-b border-cyan border-opacity-20">
            <div className="grid grid-cols-6 gap-3">
                {cards.map((card, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="glass-card p-3 rounded hover:glass-card-hover transition cursor-pointer group"
                    >
                        <div className="flex items-start gap-2">
                            <div className={`${card.color} opacity-60 group-hover:opacity-100 transition`}>
                                <card.icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-400 truncate">{card.title}</p>
                                <p className={`text-lg font-bold font-orbitron glow-text ${card.color}`}>
                                    {card.value}
                                </p>
                                <p className="text-xs text-cyan opacity-60 mt-0.5">{card.trend}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
