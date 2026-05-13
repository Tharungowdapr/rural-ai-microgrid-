from fastapi import FastAPI, WebSocket, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from datetime import datetime
from app.simulation.engine import SimulationEngine
from app.ems.controller import EMSController
from app.ai.forecaster import Forecaster
from app.api.routes import router

# Initialize FastAPI app
app = FastAPI(
    title="Rural Microgrid - AI Energy Management",
    description="Real-time decentralized energy network monitoring and optimization",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
simulation_engine = SimulationEngine()
ems_controller = EMSController()
forecaster = Forecaster()
connected_clients = set()

# Include API routes
app.include_router(router)

# WebSocket connection manager
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    
    try:
        # Send initial data
        await websocket.send_json({
            "type": "INIT_DATA",
            "villages": [v.dict() for v in simulation_engine.villages],
            "timestamp": datetime.now().isoformat()
        })
        
        while True:
            # Receive messages from client (for scenario triggers, etc.)
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "SCENARIO":
                scenario_id = message.get("scenario")
                await simulation_engine.trigger_scenario(scenario_id)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)

# Background task to run simulation
async def run_simulation():
    """Continuous simulation loop"""
    while True:
        try:
            # Update simulation state
            await simulation_engine.update()
            
            # Run EMS logic
            ems_decisions = await ems_controller.run(simulation_engine.villages)
            
            # Execute transfers based on EMS decisions
            for decision in ems_decisions:
                await simulation_engine.create_transfer(decision)
            
            # Generate forecasts
            forecasts = await forecaster.predict(
                simulation_engine.villages,
                simulation_engine.weather
            )
            
            # Prepare update message
            message = {
                "type": "VILLAGES_UPDATE",
                "villages": [v.dict() for v in simulation_engine.villages],
                "transfers": [t.dict() for t in simulation_engine.transfers],
                "alerts": [a.dict() for a in simulation_engine.alerts[-20:]],  # Last 20 alerts
                "forecasts": forecasts,
                "metrics": {
                    "totalGeneration": simulation_engine.total_generation,
                    "totalDemand": simulation_engine.total_demand,
                    "gridStability": simulation_engine.grid_stability,
                },
                "timestamp": datetime.now().isoformat()
            }
            
            # Broadcast to all connected clients
            for client in connected_clients:
                try:
                    await client.send_json(message)
                except Exception as e:
                    print(f"Error sending to client: {e}")
            
            # Sleep based on simulation speed
            await asyncio.sleep(2 / simulation_engine.simulation_speed)
        
        except Exception as e:
            print(f"Simulation error: {e}")
            await asyncio.sleep(1)

@app.on_event("startup")
async def startup_event():
    """Start the simulation loop on app startup"""
    asyncio.create_task(run_simulation())

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "villages": len(simulation_engine.villages),
        "transfers": len(simulation_engine.transfers),
        "connected_clients": len(connected_clients),
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Rural Microgrid Energy Management API",
        "docs": "/docs",
        "health": "/health",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
