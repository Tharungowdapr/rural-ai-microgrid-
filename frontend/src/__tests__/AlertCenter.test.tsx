import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AlertCenter from '@/components/AlertCenter';

vi.mock('@/hooks/useGridStore', () => ({
  useGridStore: vi.fn(() => ({
    alerts: [
      { id: 'a1', type: 'WARNING', message: 'Low battery SOC', timestamp: Date.now(), severity: 2 },
      { id: 'a2', type: 'INFO', message: 'Temperature rising', timestamp: Date.now(), severity: 1 },
    ],
  })),
}));

describe('AlertCenter', () => {
  it('renders alerts', () => {
    render(<AlertCenter />);
    expect(screen.getByText(/Low battery SOC/i)).toBeDefined();
    expect(screen.getByText(/Temperature rising/i)).toBeDefined();
  });

  it('shows alert count', () => {
    render(<AlertCenter />);
    expect(screen.getByText('2')).toBeDefined();
  });
});
