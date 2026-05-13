import { useEffect, useRef, useCallback } from 'react';
import { useGridStore } from './useGridStore';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export const useWebSocket = () => {
    const wsRef = useRef<WebSocket | null>(null);
    const {
        updateVillage,
        addTransfer,
        removeTransfer,
        addAlert,
        updateForecasts,
        setMetrics,
        initializeVillages,
    } = useGridStore();

    useEffect(() => {
        const connectWebSocket = () => {
            try {
                wsRef.current = new WebSocket(WS_URL);

                wsRef.current.onopen = () => {
                    console.log('WebSocket connected');
                };

                wsRef.current.onmessage = (event) => {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case 'VILLAGES_UPDATE':
                            data.villages.forEach((village: any) => updateVillage(village));
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
                            break;

                        default:
                            console.log('Unknown message type:', data.type);
                    }
                };

                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                wsRef.current.onclose = () => {
                    console.log('WebSocket disconnected, attempting to reconnect...');
                    setTimeout(connectWebSocket, 3000);
                };
            } catch (error) {
                console.error('Failed to connect WebSocket:', error);
                setTimeout(connectWebSocket, 3000);
            }
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [updateVillage, addTransfer, removeTransfer, addAlert, updateForecasts, setMetrics, initializeVillages]);

    const send = useCallback((message: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        }
    }, []);

    return { send };
};
