import { useEffect, useRef, useCallback } from 'react';
import { useGridStore, Village } from './useGridStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000;

export const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
            try {
                wsRef.current = new WebSocket(WS_URL);

                wsRef.current.onopen = () => {
                    console.log('WebSocket connected');
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
                    }
                };

                wsRef.current.onerror = () => {};

                wsRef.current.onclose = () => {
                    reconnectRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY);
                };
            } catch {
                reconnectRef.current = setTimeout(connectWebSocket, RECONNECT_DELAY);
            }
        };

        connectWebSocket();

        return () => {
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [updateVillage, addTransfer, removeTransfer, addAlert, updateForecasts, setAIInsights, setMetrics, initializeVillages]);

    const send = useCallback((message: object) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { send };
};
