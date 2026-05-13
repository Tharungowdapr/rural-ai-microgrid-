'use client';

import { useGridStore, Village } from '@/hooks/useGridStore';
import { useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';

export default function Topology() {
    const { villages } = useGridStore();

    // Calculate positions for villages in concentric circles
    const villagePositions = useMemo(() => {
        if (villages.length === 0) {
            // Generate demo villages if none exist
            const demoVillages: Village[] = Array.from({ length: 8 }, (_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = i < 3 ? 100 : 200;
                const statuses = ['SURPLUS', 'BALANCED', 'WARNING', 'DEFICIT'] as const;
                return {
                    id: `village-${i}`,
                    name: `Village-${String.fromCharCode(65 + i)}`,
                    soc: 50 + (i * 10),
                    solarGeneration: 150 + (i * 20),
                    demand: 100 + (i * 15),
                    status: statuses[i % 4],
                    temperature: 25 + i,
                    frequency: 50 + (i * 0.05),
                    criticalLoad: 40 + (i * 8),
                    standardLoad: 80 + (i * 15),
                    x: 400 + radius * Math.cos(angle),
                    y: 300 + radius * Math.sin(angle),
                };
            });
            return demoVillages;
        }
        return villages;
    }, [villages]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SURPLUS':
                return '#00ff41';
            case 'BALANCED':
                return '#00d4ff';
            case 'WARNING':
                return '#ffa500';
            case 'DEFICIT':
                return '#ff0040';
            default:
                return '#00d4ff';
        }
    };

    const getNodeGlow = (status: string) => {
        switch (status) {
            case 'SURPLUS':
                return 'filter-green';
            case 'BALANCED':
                return 'filter-cyan';
            case 'WARNING':
                return 'filter-amber';
            case 'DEFICIT':
                return 'filter-red';
            default:
                return 'filter-cyan';
        }
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-darker-blue to-deep-blue rounded-lg overflow-hidden">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 800 600"
                preserveAspectRatio="xMidYMid meet"
                className="absolute"
            >
                <defs>
                    {/* Gradient for energy lines */}
                    <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#00ff41" stopOpacity="0.8" />
                    </linearGradient>

                    {/* Glow filters */}
                    <filter id="glow-green">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="glow-cyan">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Connection lines between villages */}
                {villagePositions.map((village, i) => {
                    const nextVillage = villagePositions[(i + 1) % villagePositions.length];
                    return (
                        <line
                            key={`line-${i}`}
                            x1={village.x}
                            y1={village.y}
                            x2={nextVillage.x}
                            y2={nextVillage.y}
                            stroke={getStatusColor(village.status)}
                            strokeWidth="1"
                            opacity="0.3"
                            strokeDasharray="5,5"
                        />
                    );
                })}

                {/* Villages as nodes */}
                {villagePositions.map((village) => (
                    <g key={village.id}>
                        {/* Outer ring - Battery SOC */}
                        <circle
                            cx={village.x}
                            cy={village.y}
                            r="50"
                            fill="none"
                            stroke={getStatusColor(village.status)}
                            strokeWidth="2"
                            opacity="0.5"
                        />

                        {/* Middle ring - Standard Demand */}
                        <circle
                            cx={village.x}
                            cy={village.y}
                            r="35"
                            fill="none"
                            stroke={getStatusColor(village.status)}
                            strokeWidth="1"
                            opacity="0.3"
                        />

                        {/* Inner ring - Critical Demand */}
                        <circle
                            cx={village.x}
                            cy={village.y}
                            r="20"
                            fill="none"
                            stroke={getStatusColor(village.status)}
                            strokeWidth="1"
                            opacity="0.2"
                        />

                        {/* Node center glow */}
                        <circle
                            cx={village.x}
                            cy={village.y}
                            r="15"
                            fill={getStatusColor(village.status)}
                            opacity="0.7"
                            filter="url(#glow-cyan)"
                        />

                        {/* Battery percentage text */}
                        <text
                            x={village.x}
                            y={village.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="#fff"
                            fontSize="12"
                            fontWeight="bold"
                            fontFamily="monospace"
                        >
                            {Math.round(village.soc)}%
                        </text>

                        {/* Village label */}
                        <text
                            x={village.x}
                            y={village.y + 65}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={getStatusColor(village.status)}
                            fontSize="11"
                            fontWeight="bold"
                            fontFamily="monospace"
                            opacity="0.9"
                        >
                            {village.name}
                        </text>

                        {/* Status indicator */}
                        <circle
                            cx={village.x + 35}
                            cy={village.y - 35}
                            r="4"
                            fill={getStatusColor(village.status)}
                            opacity="0.8"
                        />
                    </g>
                ))}
            </svg>

            {/* Center label */}
            <div className="absolute text-center pointer-events-none">
                <p className="text-cyan text-xs opacity-50 glow-text">Energy Mesh Network</p>
            </div>
        </div>
    );
}
