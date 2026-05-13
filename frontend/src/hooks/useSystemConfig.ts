'use client';

import { create } from 'zustand';

export interface SystemConfig {
    // City/Grid Settings
    numVillages: number;
    averageHubCapacity: number; // kWh
    averageOutpostCapacity: number; // kWh

    // Day/Time Settings
    dayChargeTarget: number; // % target for daytime charging
    nightChargeTarget: number; // % target for nighttime
    chargeStartHour: number; // When to prioritize charging
    chargeEndHour: number;

    // Solar/Weather Settings
    baseSolarIrradiance: number; // W/m² at peak
    seasonalAdjustment: number; // % adjustment
    averageCloudCover: number; // %

    // Demand Settings
    baseResidentialDemand: number; // kW
    baseCriticalDemand: number; // kW
    peakDemandHour: number;

    // EMS/Control Settings
    emsCriticalThreshold: number; // SOC % - trigger load shedding
    emsDeficitThreshold: number; // SOC % - request transfer
    transferEfficiency: number; // % transmission efficiency
    maxTransferRate: number; // kW max transfer rate

    // Battery Settings
    batteryDegradationRate: number; // % per cycle
    maxChargeRate: number; // % per hour
    maxDischargeRate: number; // % per hour
}

interface ConfigState {
    config: SystemConfig;
    updateConfig: (config: Partial<SystemConfig>) => void;
    resetConfig: () => void;
    getConfig: () => SystemConfig;
}

const DEFAULT_CONFIG: SystemConfig = {
    numVillages: 8,
    averageHubCapacity: 500,
    averageOutpostCapacity: 300,

    dayChargeTarget: 85,
    nightChargeTarget: 60,
    chargeStartHour: 6,
    chargeEndHour: 18,

    baseSolarIrradiance: 1000,
    seasonalAdjustment: 0,
    averageCloudCover: 30,

    baseResidentialDemand: 150,
    baseCriticalDemand: 100,
    peakDemandHour: 18,

    emsCriticalThreshold: 30,
    emsDeficitThreshold: 50,
    transferEfficiency: 96.4,
    maxTransferRate: 50,

    batteryDegradationRate: 0.1,
    maxChargeRate: 0.2,
    maxDischargeRate: 0.2,
};

export const useSystemConfig = create<ConfigState>((set, get) => ({
    config: DEFAULT_CONFIG,

    updateConfig: (newConfig: Partial<SystemConfig>) => {
        set((state) => ({
            config: { ...state.config, ...newConfig },
        }));
    },

    resetConfig: () => {
        set({ config: DEFAULT_CONFIG });
    },

    getConfig: () => get().config,
}));
