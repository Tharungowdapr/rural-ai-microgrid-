import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AIPanel from '@/components/AIPanel';

vi.mock('@/hooks/useGridStore', () => ({
  useGridStore: vi.fn(() => ({
    forecasts: [
      { demand: 100, generation: 120, confidence: 0.85, timestamp: Date.now(), source: 'model' },
      { demand: 110, generation: 115, confidence: 0.80, timestamp: Date.now(), source: 'model' },
    ],
    ai_insights: [
      { type: 'info', title: 'Forecast Complete', content: 'LSTM model: 6-hour prediction loaded', severity: 1 },
    ],
  })),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

describe('AIPanel', () => {
  it('shows AI grid intelligence header', () => {
    render(<AIPanel />);
    expect(screen.getByText('AI GRID INTELLIGENCE')).toBeDefined();
  });

  it('shows LSTM model active badge', () => {
    render(<AIPanel />);
    expect(screen.getByText('LSTM Model Active')).toBeDefined();
  });

  it('shows prediction confidence', () => {
    render(<AIPanel />);
    expect(screen.getByText(/Prediction Confidence/)).toBeDefined();
  });

  it('renders AI insights', () => {
    render(<AIPanel />);
    expect(screen.getByText('Forecast Complete')).toBeDefined();
  });
});
