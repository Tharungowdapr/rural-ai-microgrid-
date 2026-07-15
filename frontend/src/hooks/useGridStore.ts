import { create } from 'zustand';

export interface Village {
    id: string;
    name: string;
    soc: number;
    solarGeneration: number;
    demand: number;
    status: 'SURPLUS' | 'BALANCED' | 'WARNING' | 'DEFICIT';
    temperature: number;
    frequency: number;
    criticalLoad: number;
    standardLoad: number;
    x: number;
    y: number;
    maxCapacity: number;
    chargingRate: number;
    degradation: number;
    standardShedPercentage: number;
    criticalShedPercentage: number;
    hospitalDemand: number;
    waterPumpDemand: number;
    residentialDemand: number;
    schoolDemand: number;
    emergencySpike: number;
    solarPanelCapacity: number;
    lat: number;
    lng: number;
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

export interface AIInsight {
    type: 'trend' | 'alert' | 'info';
    title: string;
    content: string;
    severity: number;
}

interface GridState {
    villages: Village[];
    transfers: Transfer[];
    alerts: Alert[];
    forecasts: Forecast[];
    ai_insights: AIInsight[];
    totalGeneration: number;
    totalDemand: number;
    gridStability: number;
    activeTransfers: number;
    simulationRunning: boolean;
    simulationSpeed: number;
    weatherCondition: string;
    weatherTemperature: number;
    weatherHumidity: number;
    weatherWindSpeed: number;
    weatherCloudCover: number;
    simulationHour: number;

    updateVillage: (village: Village) => void;
    setTransfers: (transfers: Transfer[]) => void;
    addTransfer: (transfer: Transfer) => void;
    removeTransfer: (id: string) => void;
    addAlert: (alert: Alert) => void;
    updateForecasts: (forecasts: Forecast[]) => void;
    setAIInsights: (insights: AIInsight[]) => void;
    setMetrics: (metrics: {
        totalGeneration: number;
        totalDemand: number;
        gridStability: number;
        weatherCondition?: string;
        temperature?: number;
        humidity?: number;
        windSpeed?: number;
        cloudCover?: number;
        simulationHour?: number;
    }) => void;
    setSimulationRunning: (running: boolean) => void;
    setSimulationSpeed: (speed: number) => void;
    initializeVillages: (villages: Village[]) => void;
}

const DEMO_VILLAGES: Village[] = [
    { id: "village-0", name: "Barkheda", soc: 72, solarGeneration: 245, demand: 134, status: "SURPLUS", temperature: 28, frequency: 50.1, criticalLoad: 54, standardLoad: 80, x: 150, y: 480, maxCapacity: 500, chargingRate: 0.1, degradation: 0, standardShedPercentage: 0, criticalShedPercentage: 0, hospitalDemand: 32, waterPumpDemand: 22, residentialDemand: 55, schoolDemand: 25, emergencySpike: 0, solarPanelCapacity: 320, lat: 23.1100, lng: 77.5600 },
    { id: "village-1", name: "Raisen", soc: 48, solarGeneration: 218, demand: 196, status: "WARNING", temperature: 26, frequency: 49.8, criticalLoad: 78, standardLoad: 118, x: 500, y: 80, maxCapacity: 500, chargingRate: 0.1, degradation: 0, standardShedPercentage: 0, criticalShedPercentage: 0, hospitalDemand: 35, waterPumpDemand: 25, residentialDemand: 65, schoolDemand: 30, emergencySpike: 0, solarPanelCapacity: 300, lat: 23.3300, lng: 77.5900 },
    { id: "village-2", name: "Mandideep", soc: 85, solarGeneration: 280, demand: 110, status: "SURPLUS", temperature: 30, frequency: 50.2, criticalLoad: 44, standardLoad: 66, x: 850, y: 480, maxCapacity: 500, chargingRate: 0.1, degradation: 0, standardShedPercentage: 0, criticalShedPercentage: 0, hospitalDemand: 28, waterPumpDemand: 18, residentialDemand: 42, schoolDemand: 22, emergencySpike: 0, solarPanelCapacity: 360, lat: 23.1800, lng: 77.4600 },
    { id: "village-3", name: "Sanchi", soc: 35, solarGeneration: 190, demand: 210, status: "DEFICIT", temperature: 27, frequency: 49.5, criticalLoad: 84, standardLoad: 126, x: 350, y: 280, maxCapacity: 500, chargingRate: 0.1, degradation: 0, standardShedPercentage: 50, criticalShedPercentage: 0, hospitalDemand: 38, waterPumpDemand: 22, residentialDemand: 70, schoolDemand: 28, emergencySpike: 0, solarPanelCapacity: 280, lat: 23.4800, lng: 77.7400 },
    { id: "village-4", name: "Narsinghgarh", soc: 62, solarGeneration: 230, demand: 155, status: "BALANCED", temperature: 29, frequency: 50.0, criticalLoad: 62, standardLoad: 93, x: 650, y: 300, maxCapacity: 500, chargingRate: 0.1, degradation: 0, standardShedPercentage: 0, criticalShedPercentage: 0, hospitalDemand: 30, waterPumpDemand: 20, residentialDemand: 55, schoolDemand: 25, emergencySpike: 0, solarPanelCapacity: 310, lat: 23.4500, lng: 77.1000 },
];

const DEMO_TRANSFERS: Transfer[] = [
    { id: "transfer-0", source: "village-2", destination: "village-3", rate: 45, efficiency: 96.4, status: "ACTIVE", relayStatus: "ACTIVE", startTime: Date.now() - 5000 },
    { id: "transfer-1", source: "village-0", destination: "village-3", rate: 30, efficiency: 96.4, status: "ACTIVE", relayStatus: "ACTIVE", startTime: Date.now() - 3000 },
];

const DEMO_ALERTS: Alert[] = [
    { id: "alert-init-1", type: "INFO", message: "System initialized: 5 villages online", timestamp: Date.now() - 10000, severity: 0 },
    { id: "alert-init-2", type: "EMS", message: "Transfer initiated: Village-C → Village-D (45.0 kW)", timestamp: Date.now() - 5000, severity: 1 },
    { id: "alert-init-3", type: "WARNING", message: "Village-D SOC critical at 35%", timestamp: Date.now() - 3000, severity: 2 },
    { id: "alert-init-4", type: "EMS", message: "Transfer initiated: Village-A → Village-D (30.0 kW)", timestamp: Date.now() - 2000, severity: 1 },
];

const DEMO_FORECASTS: Forecast[] = [];

const DEMO_INSIGHTS: AIInsight[] = [];

export const useGridStore = create<GridState>((set) => ({
    villages: DEMO_VILLAGES,
    transfers: DEMO_TRANSFERS,
    alerts: DEMO_ALERTS,
    forecasts: DEMO_FORECASTS,
    ai_insights: DEMO_INSIGHTS,
    totalGeneration: 1.163,
    totalDemand: 0.805,
    gridStability: 94.2,
    activeTransfers: 2,
    simulationRunning: false,
    simulationSpeed: 1,
    weatherCondition: "partly_cloudy",
    weatherTemperature: 28,
    weatherHumidity: 72,
    weatherWindSpeed: 12,
    weatherCloudCover: 35,
    simulationHour: 14,

    updateVillage: (village) =>
        set((state) => ({
            villages: state.villages.map((v) => (v.id === village.id ? village : v)),
        })),

    setTransfers: (transfers) =>
        set({ transfers, activeTransfers: transfers.length }),

    addTransfer: (transfer) =>
        set((state) => ({
            transfers: [...state.transfers, transfer],
            activeTransfers: state.transfers.length + 1,
        })),

    removeTransfer: (id) =>
        set((state) => {
            const remaining = state.transfers.filter((t) => t.id !== id);
            return { transfers: remaining, activeTransfers: remaining.length };
        }),

    addAlert: (alert) =>
        set((state) => ({
            alerts: [alert, ...state.alerts.slice(0, 99)], // Keep last 100 alerts
        })),

    updateForecasts: (forecasts) =>
        set({
            forecasts,
        }),

    setAIInsights: (ai_insights) =>
        set({
            ai_insights,
        }),

    setMetrics: (metrics) =>
        set({
            totalGeneration: metrics.totalGeneration,
            totalDemand: metrics.totalDemand,
            gridStability: metrics.gridStability,
            ...(metrics.weatherCondition !== undefined && { weatherCondition: metrics.weatherCondition }),
            ...(metrics.temperature !== undefined && { weatherTemperature: metrics.temperature }),
            ...(metrics.humidity !== undefined && { weatherHumidity: metrics.humidity }),
            ...(metrics.windSpeed !== undefined && { weatherWindSpeed: metrics.windSpeed }),
            ...(metrics.cloudCover !== undefined && { weatherCloudCover: metrics.cloudCover }),
            ...(metrics.simulationHour !== undefined && { simulationHour: metrics.simulationHour }),
        }),

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
