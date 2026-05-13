import { create } from 'zustand';

export interface Village {
    id: string;
    name: string;
    soc: number; // State of Charge (0-100)
    solarGeneration: number; // kW
    demand: number; // kW
    status: 'SURPLUS' | 'BALANCED' | 'WARNING' | 'DEFICIT';
    temperature: number; // Celsius
    frequency: number; // Hz
    criticalLoad: number; // kW
    standardLoad: number; // kW
    x: number;
    y: number;
}

export interface Transfer {
    id: string;
    source: string;
    destination: string;
    rate: number; // kW
    efficiency: number; // %
    status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
    relayStatus: string;
    startTime: number;
}

export interface Alert {
    id: string;
    type: 'CRITICAL' | 'WARNING' | 'INFO' | 'AI' | 'EMS';
    message: string;
    timestamp: number;
    severity: number;
}

export interface Forecast {
    timestamp: number;
    demand: number;
    generation: number;
    confidence: number;
}

interface GridState {
    villages: Village[];
    transfers: Transfer[];
    alerts: Alert[];
    forecasts: Forecast[];
    totalGeneration: number;
    totalDemand: number;
    gridStability: number;
    activeTransfers: number;
    simulationRunning: boolean;
    simulationSpeed: number;

    // Actions
    updateVillage: (village: Village) => void;
    addTransfer: (transfer: Transfer) => void;
    removeTransfer: (id: string) => void;
    addAlert: (alert: Alert) => void;
    updateForecasts: (forecasts: Forecast[]) => void;
    setMetrics: (metrics: {
        totalGeneration: number;
        totalDemand: number;
        gridStability: number;
    }) => void;
    setSimulationRunning: (running: boolean) => void;
    setSimulationSpeed: (speed: number) => void;
    initializeVillages: (villages: Village[]) => void;
}

export const useGridStore = create<GridState>((set) => ({
    villages: [],
    transfers: [],
    alerts: [],
    forecasts: [],
    totalGeneration: 0,
    totalDemand: 0,
    gridStability: 100,
    activeTransfers: 0,
    simulationRunning: false,
    simulationSpeed: 1,

    updateVillage: (village) =>
        set((state) => ({
            villages: state.villages.map((v) => (v.id === village.id ? village : v)),
        })),

    addTransfer: (transfer) =>
        set((state) => ({
            transfers: [...state.transfers, transfer],
            activeTransfers: state.transfers.length + 1,
        })),

    removeTransfer: (id) =>
        set((state) => ({
            transfers: state.transfers.filter((t) => t.id !== id),
            activeTransfers: Math.max(0, state.transfers.length - 1),
        })),

    addAlert: (alert) =>
        set((state) => ({
            alerts: [alert, ...state.alerts.slice(0, 99)], // Keep last 100 alerts
        })),

    updateForecasts: (forecasts) =>
        set({
            forecasts,
        }),

    setMetrics: (metrics) =>
        set(metrics),

    setSimulationRunning: (running) =>
        set({
            simulationRunning: running,
        }),

    setSimulationSpeed: (speed) =>
        set({
            simulationSpeed: speed,
        }),

    initializeVillages: (villages) =>
        set({
            villages,
        }),
}));
