'use client';

import { useGridStore, Village, Transfer } from '@/hooks/useGridStore';
import { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS: Record<string, string> = {
    SURPLUS: '#00ff41',
    BALANCED: '#00d4ff',
    WARNING: '#ffa500',
    DEFICIT: '#ff0040',
};

const STATUS_GLOWS: Record<string, string> = {
    SURPLUS: '0 0 14px #00ff41',
    BALANCED: '0 0 14px #00d4ff',
    WARNING: '0 0 14px #ffa500',
    DEFICIT: '0 0 14px #ff0040',
};

function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || '#00d4ff';
}

function createVillageIcon(village: Village): L.DivIcon {
    const color = getStatusColor(village.status);
    const glow = STATUS_GLOWS[village.status] || '0 0 14px #00d4ff';
    const socWidth = Math.max(0, Math.min(100, village.soc));
    const net = village.solarGeneration - village.demand;
    const charging = net > 10;
    const discharging = net < -10;
    const flowIcon = charging ? '&#9650;' : discharging ? '&#9660;' : '';
    const flowColor = charging ? '#00ff41' : discharging ? '#ff0040' : '#888';

    return L.divIcon({
        className: 'village-marker-icon',
        html: `
            <div class="village-marker-inner" style="--status-color: ${color}; box-shadow: ${glow}; width: 52px; height: 52px;">
                <div style="position: absolute; top: -18px; left: 50%; transform: translateX(-50%); white-space: nowrap; text-align: center;">
                    <div style="background: rgba(0,0,0,0.85); border: 1px solid ${color}; border-radius: 6px; padding: 2px 6px; display: inline-block;">
                        <span style="color: ${color}; font-size: 9px; font-weight: 700; font-family: sans-serif; letter-spacing: 0.3px;">${village.name}</span>
                    </div>
                </div>
                <div style="position: relative; z-index: 1; text-align: center; line-height: 1;">
                    <span class="village-soc" style="color: #fff; font-size: 13px; font-weight: 800; font-family: monospace; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${Math.round(village.soc)}%</span>
                    <div style="position: absolute; top: -1px; right: -8px; font-size: 8px; color: ${flowColor}; text-shadow: 0 0 4px ${flowColor};">${flowIcon}</div>
                </div>
                <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 32px; height: 3px; background: rgba(255,255,255,0.15); border-radius: 2px; overflow: hidden;">
                    <div style="width: ${socWidth}%; height: 100%; background: ${color}; border-radius: 2px; transition: width 0.5s;"></div>
                </div>
            </div>
        `,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
    });
}

function StatusLegend() {
    const entries = [
        { label: 'SURPLUS', color: '#00ff41', desc: 'Net exporter' },
        { label: 'BALANCED', color: '#00d4ff', desc: 'Self-sufficient' },
        { label: 'WARNING', color: '#ffa500', desc: 'Low SOC' },
        { label: 'DEFICIT', color: '#ff0040', desc: 'Needs power' },
    ];

    return (
        <div className="absolute bottom-4 left-4 z-[1000] glass-card rounded-xl p-3 pointer-events-none" style={{ backdropFilter: 'blur(12px)' }}>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Village Status</p>
            {entries.map(e => (
                <div key={e.label} className="flex items-center gap-2 text-[10px] text-zinc-300 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color, boxShadow: `0 0 6px ${e.color}` }} />
                    <span className="font-bold" style={{ color: e.color }}>{e.label}</span>
                    <span className="text-zinc-500">· {e.desc}</span>
                </div>
            ))}
        </div>
    );
}

function TransferPanel({ transfers, villages }: { transfers: Transfer[]; villages: Village[] }) {
    if (transfers.length === 0) return null;
    return (
        <div className="absolute top-3 right-3 z-[1000] glass-card rounded-xl p-3 pointer-events-none" style={{ backdropFilter: 'blur(12px)', minWidth: 180 }}>
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Active Transfers</p>
            {transfers.filter(t => t.status === 'ACTIVE').map(t => {
                const src = villages.find(v => v.id === t.source);
                const dst = villages.find(v => v.id === t.destination);
                return (
                    <div key={t.id} className="flex items-center gap-1 text-[10px] mb-1 font-mono">
                        <span className="text-emerald-400">{src?.name || t.source}</span>
                        <span className="text-zinc-500">→</span>
                        <span className="text-amber-400">{dst?.name || t.destination}</span>
                        <span className="text-sky-400 font-bold ml-auto">{t.rate.toFixed(0)}kW</span>
                    </div>
                );
            })}
        </div>
    );
}

export default function Topology({ onCityClick }: { onCityClick?: (village: Village) => void }) {
    const { villages, transfers } = useGridStore();
    const [mounted, setMounted] = useState(false);
    const [icons, setIcons] = useState<Map<string, L.DivIcon>>(new Map());
    useEffect(() => setMounted(true), []);

    useEffect(() => {
        if (!mounted) return;
        const newIcons = new Map<string, L.DivIcon>();
        for (const v of villages) {
            newIcons.set(v.id, createVillageIcon(v));
        }
        setIcons(newIcons);
    }, [villages, mounted]);

    const center = useMemo<[number, number]>(() => {
        if (villages.length > 0) {
            const avgLat = villages.reduce((s: number, v: Village) => s + v.lat, 0) / villages.length;
            const avgLng = villages.reduce((s: number, v: Village) => s + v.lng, 0) / villages.length;
            return [avgLat, avgLng];
        }
        return [23.2599, 77.5500];
    }, [villages]);

    const transferLines = useMemo(() => {
        return transfers
            .filter((t: Transfer) => t.status === 'ACTIVE')
            .map((t: Transfer) => {
                const src = villages.find((v: Village) => v.id === t.source);
                const dst = villages.find((v: Village) => v.id === t.destination);
                if (!src || !dst) return null;
                const midLat = (src.lat + dst.lat) / 2;
                const midLng = (src.lng + dst.lng) / 2;
                return {
                    key: t.id,
                    positions: [[src.lat, src.lng], [midLat, midLng], [dst.lat, dst.lng]] as [number, number][],
                    rate: t.rate,
                    srcName: src.name,
                    dstName: dst.name,
                };
            })
            .filter(Boolean);
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
                zoom={9}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {transferLines.map(line => line && (
                    <Polyline
                        key={line.key}
                        positions={line.positions}
                        pathOptions={{
                            color: '#10b981',
                            weight: 4,
                            dashArray: '12, 8',
                            opacity: 0.9,
                            className: 'transfer-line-animated',
                        }}
                    >
                        <Tooltip permanent direction="top" offset={[0, -8]} className="transfer-tooltip">
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(0,0,0,0.8)', padding: '2px 5px', borderRadius: 4 }}>
                                {line.srcName} → {line.dstName} ({line.rate.toFixed(0)} kW)
                            </span>
                        </Tooltip>
                    </Polyline>
                ))}

                {villages.map((village: Village) => {
                    const icon = icons.get(village.id);
                    return (
                        <Marker
                            key={village.id}
                            position={[village.lat, village.lng]}
                            eventHandlers={{ click: () => onCityClick?.(village) }}
                            icon={icon || undefined}
                        >
                            <Popup>
                                <div style={{ fontFamily: 'sans-serif', fontSize: 12, minWidth: 180, background: '#1a1a1a', color: '#e5e5e5', borderRadius: 8, padding: 10 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4, color: getStatusColor(village.status) }}>{village.name}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
                                        <div>SOC: <b>{village.soc.toFixed(1)}%</b></div>
                                        <div>Status: <b style={{ color: getStatusColor(village.status) }}>{village.status}</b></div>
                                        <div>Solar: <b style={{ color: '#00ff41' }}>{village.solarGeneration.toFixed(0)} kW</b></div>
                                        <div>Demand: <b style={{ color: '#ff0040' }}>{village.demand.toFixed(0)} kW</b></div>
                                        <div>Net: <b style={{ color: (village.solarGeneration - village.demand) >= 0 ? '#00ff41' : '#ff0040' }}>{(village.solarGeneration - village.demand) >= 0 ? '+' : ''}{(village.solarGeneration - village.demand).toFixed(0)} kW</b></div>
                                        <div>Temp: <b>{Math.round(village.temperature)}°C</b></div>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>

            <TransferPanel transfers={transfers} villages={villages} />
            <StatusLegend />
        </div>
    );
}
