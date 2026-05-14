'use client';

import { useGridStore, Village } from '@/hooks/useGridStore';
import { useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const VIEW_BOX_W = 1400;
const VIEW_BOX_H = 750;
const PAD = 120;

function computeLayout(villages: Village[]): Village[] {
    const n = villages.length;
    if (n === 0) return [];

    // Generate target positions that spread across the viewBox
    let targets: { x: number; y: number }[];
    if (n === 1) {
        targets = [{ x: VIEW_BOX_W / 2, y: VIEW_BOX_H / 2 }];
    } else if (n === 2) {
        targets = [
            { x: VIEW_BOX_W * 0.25, y: VIEW_BOX_H / 2 },
            { x: VIEW_BOX_W * 0.75, y: VIEW_BOX_H / 2 },
        ];
    } else if (n === 3) {
        targets = [
            { x: VIEW_BOX_W * 0.15, y: VIEW_BOX_H * 0.8 },
            { x: VIEW_BOX_W * 0.5, y: VIEW_BOX_H * 0.15 },
            { x: VIEW_BOX_W * 0.85, y: VIEW_BOX_H * 0.8 },
        ];
    } else if (n === 4) {
        targets = [
            { x: VIEW_BOX_W * 0.2, y: VIEW_BOX_H * 0.2 },
            { x: VIEW_BOX_W * 0.8, y: VIEW_BOX_H * 0.2 },
            { x: VIEW_BOX_W * 0.2, y: VIEW_BOX_H * 0.8 },
            { x: VIEW_BOX_W * 0.8, y: VIEW_BOX_H * 0.8 },
        ];
    } else {
        targets = Array.from({ length: n }, (_, i) => {
            const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
            const rx = VIEW_BOX_W / 2 - PAD;
            const ry = VIEW_BOX_H / 2 - PAD;
            return {
                x: VIEW_BOX_W / 2 + rx * Math.cos(angle),
                y: VIEW_BOX_H / 2 + ry * Math.sin(angle),
            };
        });
    }

    return villages.map((v, i) => ({
        ...v,
        x: targets[i].x,
        y: targets[i].y,
    }));
}

export default function Topology({ onCityClick }: { onCityClick?: (village: Village) => void }) {
    const { villages, transfers } = useGridStore();

    const villagePositions = useMemo(() => {
        if (villages.length === 0) {
            const demo: Village[] = Array.from({ length: 5 }, (_, i) => {
                const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
                const rx = VIEW_BOX_W / 2 - PAD;
                const ry = VIEW_BOX_H / 2 - PAD;
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
                    x: VIEW_BOX_W / 2 + rx * Math.cos(angle),
                    y: VIEW_BOX_H / 2 + ry * Math.sin(angle),
                    maxCapacity: 500, chargingRate: 0.1, degradation: 0,
                    standardShedPercentage: 0, criticalShedPercentage: 0,
                    hospitalDemand: 30, waterPumpDemand: 20,
                    residentialDemand: 50, schoolDemand: 25,
                    emergencySpike: 0, solarPanelCapacity: 300,
                };
            });
            return demo;
        }
        return computeLayout(villages);
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
        <div 
            className="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative"
            style={{
                backgroundImage: "url('/dark_map_bg.png')",
                backgroundSize: "cover",
                backgroundPosition: "center"
            }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"></div>
            <div className="absolute top-4 left-4 pointer-events-none z-10">
                <p className="text-zinc-400 text-sm font-semibold">Energy Mesh Network</p>
                <p className="text-zinc-400 text-xs">Drag to pan, scroll to zoom. Click nodes to configure.</p>
            </div>

            <TransformWrapper
                initialScale={1}
                minScale={0.5}
                maxScale={4}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
            >
                <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                    <svg
                        width="100%"
                        height="100%"
                        viewBox={`0 0 ${VIEW_BOX_W} ${VIEW_BOX_H}`}
                        preserveAspectRatio="xMidYMid meet"
                        className="w-full h-full"
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

                        {/* Static grid mesh & Background pulses */}
                        {villagePositions.map((v1, i) => {
                            return villagePositions.slice(i + 1).map((v2, j) => {
                                const dist = Math.sqrt(Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2));
                                if (dist < 350) {
                                    return (
                                        <g key={`mesh-${i}-${j}`}>
                                            <line
                                                x1={v1.x}
                                                y1={v1.y}
                                                x2={v2.x}
                                                y2={v2.y}
                                                stroke="#0ea5e9"
                                                strokeWidth="1"
                                                opacity="0.2"
                                            />
                                            {/* Ambient network pulse */}
                                            <circle r="2" fill="#0ea5e9" opacity="0.5">
                                                <animateMotion
                                                    path={`M ${v1.x} ${v1.y} L ${v2.x} ${v2.y}`}
                                                    dur={`${2 + (i+j)*0.5}s`}
                                                    repeatCount="indefinite"
                                                />
                                            </circle>
                                            <circle r="2" fill="#0ea5e9" opacity="0.5">
                                                <animateMotion
                                                    path={`M ${v2.x} ${v2.y} L ${v1.x} ${v1.y}`}
                                                    dur={`${2.5 + (i+j)*0.3}s`}
                                                    repeatCount="indefinite"
                                                />
                                            </circle>
                                        </g>
                                    );
                                }
                                return null;
                            });
                        })}

                        {/* Active power transfers with heavy animation */}
                        {transfers.map((transfer) => {
                            const source = villagePositions.find((v) => v.id === transfer.source);
                            const dest = villagePositions.find((v) => v.id === transfer.destination);
                            if (!source || !dest) return null;

                            return (
                                <g key={transfer.id}>
                                    <line
                                        x1={source.x}
                                        y1={source.y}
                                        x2={dest.x}
                                        y2={dest.y}
                                        stroke="#10b981"
                                        strokeWidth="4"
                                        strokeDasharray="15,10"
                                        opacity="0.8"
                                        className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                                    >
                                        <animate
                                            attributeName="stroke-dashoffset"
                                            from="200"
                                            to="0"
                                            dur="1.5s"
                                            repeatCount="indefinite"
                                        />
                                    </line>
                                    
                                    {/* Directional energy packet */}
                                    <circle
                                        r="6"
                                        fill="#fff"
                                        className="drop-shadow-[0_0_10px_rgba(255,255,255,1)]"
                                    >
                                        <animateMotion
                                            path={`M ${source.x} ${source.y} L ${dest.x} ${dest.y}`}
                                            dur="1.2s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                </g>
                            );
                        })}

                        {/* Villages as nodes */}
                        {villagePositions.map((village) => (
                            <g 
                                key={village.id} 
                                onClick={(e) => { e.stopPropagation(); onCityClick && onCityClick(village); }}
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {/* Household/Non-Critical Layer (Outer Ring) */}
                                <circle
                                    cx={village.x}
                                    cy={village.y}
                                    r="45"
                                    fill="rgba(255,255,255,0.03)"
                                    stroke={getStatusColor(village.status)}
                                    strokeWidth="1.5"
                                    strokeDasharray="4 4"
                                    opacity="0.6"
                                />
                                <text
                                    x={village.x}
                                    y={village.y - 52}
                                    textAnchor="middle"
                                    fill="#94a3b8"
                                    fontSize="9"
                                    fontWeight="bold"
                                    opacity="0.8"
                                >
                                    HOUSEHOLD
                                </text>

                                {/* Critical Layer (Inner Core) */}
                                <circle
                                    cx={village.x}
                                    cy={village.y}
                                    r="28"
                                    fill="rgba(0,0,0,0.5)"
                                    stroke={getStatusColor(village.status)}
                                    strokeWidth="2"
                                    opacity="0.9"
                                />
                                <circle
                                    cx={village.x}
                                    cy={village.y}
                                    r="26"
                                    fill={getStatusColor(village.status)}
                                    opacity="0.15"
                                />
                                <text
                                    x={village.x}
                                    y={village.y + 38}
                                    textAnchor="middle"
                                    fill="#f8fafc"
                                    fontSize="9"
                                    fontWeight="bold"
                                    opacity="0.9"
                                >
                                    CRITICAL
                                </text>

                                {/* Battery percentage text inside core */}
                                <text
                                    x={village.x}
                                    y={village.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#fff"
                                    fontSize="14"
                                    fontWeight="bold"
                                    fontFamily="monospace"
                                >
                                    {Math.round(village.soc)}%
                                </text>

                                {/* Village label */}
                                <text
                                    x={village.x}
                                    y={village.y + 60}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="#f1f5f9"
                                    fontSize="13"
                                    fontWeight="bold"
                                    fontFamily="inter"
                                    opacity="1"
                                    className="drop-shadow-md"
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
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
