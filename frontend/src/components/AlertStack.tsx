'use client';

import { useGridStore, Alert } from '@/hooks/useGridStore';
import { AlertTriangle, AlertCircle, Info, Radio } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function AlertStack() {
    const { alerts } = useGridStore();
    const [visibleAlerts, setVisibleAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        // Show only the latest 3 alerts
        setVisibleAlerts(alerts.slice(0, 3));
    }, [alerts]);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'CRITICAL':
                return <AlertTriangle size={16} />;
            case 'WARNING':
                return <AlertCircle size={16} />;
            case 'AI':
                return <Radio size={16} />;
            default:
                return <Info size={16} />;
        }
    };

    const getAlertClass = (type: string) => {
        switch (type) {
            case 'CRITICAL':
                return 'bg-critical-red bg-opacity-90 border-critical-red text-white';
            case 'WARNING':
                return 'bg-amber bg-opacity-90 border-amber text-deep-blue font-bold';
            case 'AI':
                return 'bg-ai-purple bg-opacity-90 border-ai-purple text-white';
            case 'INFO':
                return 'bg-cyan bg-opacity-90 border-cyan text-deep-blue';
            case 'EMS':
                return 'bg-neon-green bg-opacity-90 border-neon-green text-deep-blue';
            default:
                return 'bg-gray-600 border-gray-600 text-white';
        }
    };

    return (
        <div className="fixed top-20 right-4 z-50 pointer-events-none">
            <AnimatePresence>
                {visibleAlerts.map((alert, index) => (
                    <motion.div
                        key={alert.id}
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`glass-card border-l-4 ${getAlertClass(alert.type)} p-3 rounded mb-2 max-w-sm pointer-events-auto`}
                        style={{ top: `${index * 110}px` }}
                    >
                        <div className="flex gap-2 items-start">
                            <div className="flex-shrink-0 mt-0.5">{getAlertIcon(alert.type)}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold mb-0.5">{alert.type}</p>
                                <p className="text-xs opacity-80 break-words">{alert.message}</p>
                                <p className="text-xs opacity-60 mt-1">
                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
