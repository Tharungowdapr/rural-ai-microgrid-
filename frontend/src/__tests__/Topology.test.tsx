import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useGridStore } from '@/hooks/useGridStore';
import Topology from '@/components/Topology';

vi.mock('@/hooks/useGridStore', () => ({
  useGridStore: vi.fn(() => ({
    villages: [],
    transfers: [],
  })),
}));

vi.mock('next/dynamic', () => {
  const dynamic = (importFn: () => Promise<any>, _opts?: any) => {
    const Component = (props: any) => null;
    Component.displayName = 'DynamicComponent';
    return Component;
  };
  return { __esModule: true, default: dynamic };
});

describe('Topology', () => {
  it('shows connecting state when no villages', async () => {
    render(<Topology />);
    await waitFor(() => {
      expect(screen.getByText(/Connecting to grid/i)).toBeDefined();
    });
  });
});
