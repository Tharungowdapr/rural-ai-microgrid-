import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useGridStore } from '@/hooks/useGridStore';

describe('useGridStore', () => {
  it('has initial state with demo villages', () => {
    const { result } = renderHook(() => useGridStore());
    expect(result.current.villages.length).toBe(5);
    expect(result.current.gridStability).toBe(94.2);
    expect(result.current.simulationRunning).toBe(false);
  });

  it('updates a village', () => {
    const { result } = renderHook(() => useGridStore());
    const updated = { ...result.current.villages[0], soc: 90 };
    act(() => {
      result.current.updateVillage(updated);
    });
    expect(result.current.villages[0].soc).toBe(90);
  });

  it('sets transfers', () => {
    const { result } = renderHook(() => useGridStore());
    const transfers = [{ id: 't1', source: 'v0', destination: 'v1', rate: 20, efficiency: 96, status: 'ACTIVE' as const, relayStatus: 'OK', startTime: Date.now() }];
    act(() => {
      result.current.setTransfers(transfers);
    });
    expect(result.current.transfers).toHaveLength(1);
    expect(result.current.activeTransfers).toBe(1);
  });

  it('sets simulation running', () => {
    const { result } = renderHook(() => useGridStore());
    act(() => {
      result.current.setSimulationRunning(true);
    });
    expect(result.current.simulationRunning).toBe(true);
  });
});
