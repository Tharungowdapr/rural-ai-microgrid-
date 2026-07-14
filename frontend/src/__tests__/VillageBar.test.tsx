import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VillageBar from '@/components/VillageBar';

vi.mock('@/hooks/useGridStore', () => ({
  useGridStore: vi.fn(() => ({
    villages: [
      {
        id: 'village-0', name: 'Test Village', soc: 75, status: 'BALANCED',
        demand: 100, solarGeneration: 120, temperature: 28, frequency: 50,
        criticalLoad: 30, standardLoad: 70, x: 400, y: 300,
        maxCapacity: 500, chargingRate: 0.1, degradation: 0,
        standardShedPercentage: 0, criticalShedPercentage: 0,
        hospitalDemand: 15, waterPumpDemand: 10, residentialDemand: 30,
        schoolDemand: 15, emergencySpike: 0, solarPanelCapacity: 300,
        lat: 23.26, lng: 77.41,
      },
    ],
  })),
}));

describe('VillageBar', () => {
  it('renders village name', () => {
    render(<VillageBar />);
    expect(screen.getByText('Test Village')).toBeDefined();
  });

  it('shows SOC percentage', () => {
    render(<VillageBar />);
    expect(screen.getByText(/75\.0%/)).toBeDefined();
  });

  it('shows status badge', () => {
    render(<VillageBar />);
    expect(screen.getByText('BALANCED')).toBeDefined();
  });
});
