'use client';

import { useGridStore, Village } from '@/hooks/useGridStore';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(() => import('react-leaflet/MapContainer').then(m => m.default), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet/TileLayer').then(m => m.default), { ssr: false });
const Marker = dynamic(() => import('react-leaflet/Marker').then(m => m.default), { ssr: false });
const Popup = dynamic(() => import('react-leaflet/Popup').then(m => m.default), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet/Polyline').then(m => m.default), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
    SURPLUS: '#00ff41',
    BALANCED: '#00d4ff',
    WARNING: '#ffa500',
    DEFICIT: '#ff0040',
};

function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || '#00d4ff';
}

function VillageMarker({ village, onClick }: { village: Village; onClick?: (v: Village) => void }) {
    return (
        <Marker
            position={[village.lat, village.lng]}
            eventHandlers={{ click: () => onClick?.(village) }}
            icon={typeof window !== 'undefined' ? (window as any).L?.divIcon?.({
                className: '',
                html: `
                    <div style="
                        position: relative;
                        width: 44px; height: 44px;
                        background: rgba(0,0,0,0.7);
                        border: 2px solid ${getStatusColor(village.status)};
                        border-radius: 50%;
                        display: flex; align-items: center; justify-content: center;
                        box-shadow: 0 0 12px ${getStatusColor(village.status)}80;
                        cursor: pointer;
                    ">
                        <span style="color: #fff; font-size: 11px; font-weight: bold; font-family: monospace;">
                            ${Math.round(village.soc)}%
                        </span>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22],
            }) : undefined}
        >
            <Popup>
                <div style={{ fontFamily: 'sans-serif', fontSize: 12, minWidth: 160 }}>
                    <strong style={{ fontSize: 14 }}>{village.name}</strong>
                    <div style={{ color: getStatusColor(village.status), fontWeight: 'bold' }}>
                        {village.status}
                    </div>
                    <hr style={{ margin: '4px 0' }} />
                    <div>SOC: {village.soc.toFixed(1)}%</div>
                    <div>Solar: {village.solarGeneration.toFixed(0)} kW</div>
                    <div>Demand: {village.demand.toFixed(0)} kW</div>
                    <div>Temp: {Math.round(village.temperature)}°C</div>
                </div>
            </Popup>
        </Marker>
    );
}

function StatusLegend() {
    const entries = [
        { label: 'SURPLUS', color: '#00ff41' },
        { label: 'BALANCED', color: '#00d4ff' },
        { label: 'WARNING', color: '#ffa500' },
        { label: 'DEFICIT', color: '#ff0040' },
    ];

    return (
        <div className="absolute bottom-4 left-4 z-[1000] bg-zinc-900/90 backdrop-blur-md border border-zinc-700/50 rounded-lg p-2 pointer-events-none">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Status</p>
            {entries.map(e => (
                <div key={e.label} className="flex items-center gap-2 text-[10px] text-zinc-300 mb-0.5">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                    {e.label}
                </div>
            ))}
        </div>
    );
}

export default function Topology({ onCityClick }: { onCityClick?: (village: Village) => void }) {
    const { villages, transfers } = useGridStore();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const center = useMemo<[number, number]>(() => {
        if (villages.length > 0) {
            const avgLat = villages.reduce((s, v) => s + v.lat, 0) / villages.length;
            const avgLng = villages.reduce((s, v) => s + v.lng, 0) / villages.length;
            return [avgLat, avgLng];
        }
        return [23.2599, 77.4126]; // Default: Bhopal area
    }, [villages]);

    const transferLines = useMemo(() => {
        return transfers.map(t => {
            const src = villages.find(v => v.id === t.source);
            const dst = villages.find(v => v.id === t.destination);
            if (!src || !dst) return null;
            return {
                key: t.id,
                positions: [[src.lat, src.lng], [dst.lat, dst.lng]] as [number, number][],
            };
        }).filter(Boolean);
    }, [transfers, villages]);

    if (!mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-zinc-400">Loading map...</p>
                </div>
            </div>
        );
    }

    if (villages.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm font-bold text-zinc-300">Connecting to grid...</p>
                    <p className="text-xs text-zinc-500 mt-1">Waiting for village data from the backend</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative">
            <MapContainer
                center={center}
                zoom={11}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {transferLines.map(line => line && (
                    <Polyline
                        key={line.key}
                        positions={line.positions}
                        pathOptions={{
                            color: '#10b981',
                            weight: 3,
                            dashArray: '10, 8',
                            opacity: 0.8,
                        }}
                    />
                ))}

                {villages.map(village => (
                    <VillageMarker key={village.id} village={village} onClick={onCityClick} />
                ))}
            </MapContainer>

            <div className="absolute top-3 left-12 z-[1000] pointer-events-none">
                <p className="text-zinc-400 text-sm font-semibold">Network Topology (schematic)</p>
                <p className="text-zinc-500 text-xs">Click a village node to configure</p>
            </div>

            <StatusLegend />
        </div>
    );
}
