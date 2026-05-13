'use client';

import { useGridStore } from '@/hooks/useGridStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Play, Pause, Zap } from 'lucide-react';

export default function ScenarioControls() {
    const { simulationRunning, setSimulationRunning, simulationSpeed, setSimulationSpeed } =
        useGridStore();
    const { send } = useWebSocket();

    const scenarios = [
        { id: 'heatwave', label: 'Heatwave', icon: '🌡️' },
        { id: 'cloudcover', label: 'Cloud Cover', icon: '☁️' },
        { id: 'relay-failure', label: 'Relay Failure', icon: '⚡' },
        { id: 'hospital-surge', label: 'Hospital Surge', icon: '🏥' },
        { id: 'blackout', label: 'Blackout', icon: '🔌' },
        { id: 'storm', label: 'Storm', icon: '⛈️' },
    ];

    const handleScenario = (scenarioId: string) => {
        send({
            type: 'SCENARIO',
            scenario: scenarioId,
        });
    };

    return (
        <div className="space-y-2">
            <h3 className="text-xs font-bold font-orbitron text-cyan glow-text">
                SCENARIO CONTROLS
            </h3>

            {/* Simulation Controls */}
            <div className="glass-card p-2 rounded space-y-2">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSimulationRunning(!simulationRunning)}
                        className="flex-1 bg-neon-green bg-opacity-80 hover:bg-opacity-100 text-deep-blue font-bold py-1 rounded text-xs flex items-center justify-center gap-1 transition"
                    >
                        {simulationRunning ? (
                            <>
                                <Pause size={12} /> PAUSE
                            </>
                        ) : (
                            <>
                                <Play size={12} /> PLAY
                            </>
                        )}
                    </button>
                </div>

                {/* Speed Control */}
                <div>
                    <label className="text-xs text-gray-400 block mb-1">Speed: {simulationSpeed}x</label>
                    <input
                        type="range"
                        min="0.5"
                        max="4"
                        step="0.5"
                        value={simulationSpeed}
                        onChange={(e) => setSimulationSpeed(parseFloat(e.target.value))}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Event Scenarios */}
            <div className="glass-card p-2 rounded">
                <p className="text-xs text-gray-400 mb-2">Trigger Events</p>
                <div className="grid grid-cols-2 gap-1">
                    {scenarios.map((scenario) => (
                        <button
                            key={scenario.id}
                            onClick={() => handleScenario(scenario.id)}
                            className="glass-card hover:glass-card-hover p-2 rounded text-xs font-bold transition text-center cursor-pointer border border-cyan border-opacity-20 hover:border-opacity-60"
                        >
                            <span className="block mb-0.5">{scenario.icon}</span>
                            <span className="text-xs text-cyan">{scenario.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* System Status */}
            <div className="glass-card p-2 rounded text-xs">
                <div className="flex items-center gap-1">
                    <Zap size={12} className={simulationRunning ? 'text-neon-green' : 'text-gray-500'} />
                    <span className={simulationRunning ? 'text-neon-green' : 'text-gray-500'}>
                        {simulationRunning ? 'RUNNING' : 'PAUSED'}
                    </span>
                </div>
            </div>
        </div>
    );
}
