import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Header from '@/components/Header';

vi.mock('@/hooks/useGridStore', () => ({
  useGridStore: vi.fn(() => ({
    gridStability: 95,
    activeTransfers: 2,
    totalGeneration: 1.163,
    totalDemand: 0.805,
    villages: [{ id: 'village-0', name: 'Village-A' }],
    simulationRunning: false,
    updateForecasts: vi.fn(),
    setAIInsights: vi.fn(),
    setSimulationRunning: vi.fn(),
    initializeVillages: vi.fn(),
    setMetrics: vi.fn(),
  })),
}));

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    connectionStatus: 'connected',
  })),
}));

describe('Header', () => {
  it('renders grid title', () => {
    render(<Header />);
    expect(screen.getByText('Rural Microgrid')).toBeDefined();
  });

  it('shows connection status', () => {
    render(<Header />);
    expect(screen.getByText('Online')).toBeDefined();
  });

  it('shows grid stability', () => {
    render(<Header />);
    expect(screen.getByText('95.0%')).toBeDefined();
  });
});
