import { useEffect, useRef, useCallback, useState } from 'react';
import { useGridStore, Village } from './useGridStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;

export const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
    const [lastError, setLastError] = useState<string | null>(null);
    const {
        updateVillage,
        setTransfers,
        addTransfer,
        removeTransfer,
        addAlert,
        updateForecasts,
        setAIInsights,
        setMetrics,
        initializeVillages,
        setSimulationRunning,
    } = useGridStore();

    useEffect(() => {
        const connectWebSocket = () => {
            setConnectionStatus('connecting');
            try {
                wsRef.current = new WebSocket(WS_URL);

                wsRef.current.onopen = () => {
                    console.log('WebSocket connected');
                    setConnectionStatus('connected');
                    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
                };

                wsRef.current.onmessage = (event) => {
                    let data: any;
                    try {
                        data = JSON.parse(event.data);
                    } catch {
                        console.error('Failed to parse WebSocket message');
                        return;
                    }

                    switch (data.type) {
                        case 'VILLAGES_UPDATE':
                            data.villages.forEach((village: Village) => updateVillage(village));
                            if (data.transfers) setTransfers(data.transfers);
                            if (data.alerts) data.alerts.forEach((a: any) => addAlert(a));
                            if (data.forecasts) updateForecasts(data.forecasts);
                            if (data.ai_insights) setAIInsights(data.ai_insights);
                            if (data.metrics) {
                                setMetrics(data.metrics);
                                if (data.metrics.is_paused !== undefined) {
                                    setSimulationRunning(!data.metrics.is_paused);
                                }
                            }
                            break;

                        case 'METRICS_UPDATE':
                            setMetrics({
                                totalGeneration: data.totalGeneration,
                                totalDemand: data.totalDemand,
                                gridStability: data.gridStability,
                            });
                            break;

                        case 'TRANSFER_STARTED':
                            addTransfer(data.transfer);
                            break;

                        case 'TRANSFER_COMPLETED':
                            removeTransfer(data.transferId);
                            break;

                        case 'ALERT':
                            addAlert(data.alert);
                            break;

                        case 'FORECAST_UPDATE':
                            updateForecasts(data.forecasts);
                            break;

                        case 'INIT_DATA':
                            initializeVillages(data.villages);
                            if (data.paused !== undefined) setSimulationRunning(!data.paused);
                            break;

                        case 'ERROR':
                            console.error('Server error:', data.message);
                            setLastError(data.message);
                            addAlert({
                                id: `error-${Date.now()}`,
                                type: 'CRITICAL',
                                message: data.message,
                                timestamp: Date.now(),
                                severity: 3,
                            });
                            break;
                    }
                };

                wsRef.current.onerror = () => {
                    console.error('WebSocket error');
                };

                wsRef.current.onclose = () => {
                    setConnectionStatus('disconnected');
                    const delay = reconnectDelayRef.current;
                    reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
                    console.log(`WebSocket closed, reconnecting in ${delay}ms`);
                    reconnectRef.current = setTimeout(connectWebSocket, delay);
                };
            } catch {
                const delay = reconnectDelayRef.current;
                reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
                reconnectRef.current = setTimeout(connectWebSocket, delay);
            }
        };

        connectWebSocket();

        return () => {
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
            }
        };
    }, [updateVillage, setTransfers, addTransfer, removeTransfer, addAlert, updateForecasts, setAIInsights, setMetrics, initializeVillages, setSimulationRunning]);

    const send = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { send, connectionStatus, lastError };
};
