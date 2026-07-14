"""FastAPI application — server, WebSocket, and simulation loop."""

import asyncio
import json
import logging
import sys
from datetime import datetime

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.dependencies import ems_controller, forecaster, simulation_engine

# ---------- Logging ----------

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# ---------- FastAPI app ----------

app = FastAPI(
    title="Rural Microgrid - AI Energy Management",
    description="Real-time decentralized energy network monitoring and optimization",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

connected_clients: set = set()
current_ai_insights: list = []
last_ai_update: float = 0

app.include_router(router)


# ---------- WebSocket ----------


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info("WebSocket client connected (total: %d)", len(connected_clients))

    try:
        await websocket.send_json({
            "type": "INIT_DATA",
            "villages": [v.dict() for v in simulation_engine.villages],
            "paused": simulation_engine.is_paused,
            "timestamp": datetime.now().isoformat(),
        })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "SCENARIO":
                scenario_id = message.get("scenario")
                await simulation_engine.trigger_scenario(scenario_id)

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected normally")
    except Exception as e:
        logger.warning("WebSocket error: %s", e)
    finally:
        connected_clients.discard(websocket)
        logger.info("WebSocket client removed (total: %d)", len(connected_clients))


async def _broadcast_error(message: str) -> None:
    """Broadcast an ERROR message to all connected clients."""
    error_payload = {
        "type": "ERROR",
        "message": message,
        "timestamp": datetime.now().isoformat(),
    }
    for client in list(connected_clients):
        try:
            await client.send_json(error_payload)
        except Exception:
            connected_clients.discard(client)


# ---------- Background simulation loop ----------


async def run_simulation():
    """Continuous simulation loop — only broadcasts when unpaused."""
    while True:
        try:
            await simulation_engine.update()

            if not simulation_engine.is_paused:
                ems_decisions = await ems_controller.run(simulation_engine.villages)

                for decision in ems_decisions:
                    await simulation_engine.create_transfer(
                        decision["source"],
                        decision["destination"],
                        decision["rate"],
                        decision.get("note"),
                    )

                forecasts = await forecaster.predict(
                    simulation_engine.villages,
                    simulation_engine.weather,
                )

                global last_ai_update, current_ai_insights
                current_time = datetime.now().timestamp()
                if current_time - last_ai_update > 30:
                    avg_soc = (
                        sum(v.soc for v in simulation_engine.villages) / len(simulation_engine.villages)
                        if simulation_engine.villages
                        else 0
                    )
                    insights = []
                    if avg_soc < 30:
                        insights.append({
                            "type": "alert",
                            "title": "Low System SOC",
                            "content": f"Average SOC is critical at {avg_soc:.1f}%",
                            "severity": 3,
                        })
                    elif avg_soc < 50:
                        insights.append({
                            "type": "warning",
                            "title": "Decreasing SOC",
                            "content": f"Average SOC is {avg_soc:.1f}%. Consider reducing load.",
                            "severity": 2,
                        })
                    else:
                        insights.append({
                            "type": "info",
                            "title": "Stable Grid",
                            "content": f"Average SOC is healthy at {avg_soc:.1f}%",
                            "severity": 1,
                        })
                    deficit_villages = [v.name for v in simulation_engine.villages if v.soc < 30]
                    if deficit_villages:
                        insights.append({
                            "type": "alert",
                            "title": "Villages in Deficit",
                            "content": f"Critical load shedding recommended for {', '.join(deficit_villages)}.",
                            "severity": 3,
                        })
                    current_ai_insights = insights
                    last_ai_update = current_time

                message = {
                    "type": "VILLAGES_UPDATE",
                    "villages": [v.dict() for v in simulation_engine.villages],
                    "transfers": [t.dict() for t in simulation_engine.transfers],
                    "alerts": [a.dict() for a in simulation_engine.alerts[-20:]],
                    "forecasts": forecasts,
                    "ai_insights": current_ai_insights,
                    "metrics": {
                        "totalGeneration": simulation_engine.total_generation,
                        "totalDemand": simulation_engine.total_demand,
                        "gridStability": simulation_engine.grid_stability,
                        "weatherCondition": simulation_engine.weather.condition,
                        "temperature": simulation_engine.weather.temperature,
                        "humidity": simulation_engine.weather.humidity,
                        "windSpeed": simulation_engine.weather.windSpeed,
                        "cloudCover": simulation_engine.weather.cloudCover,
                        "simulationHour": simulation_engine.simulation_time.hour,
                        "is_paused": simulation_engine.is_paused,
                    },
                    "timestamp": datetime.now().isoformat(),
                }

                for client in list(connected_clients):
                    try:
                        await client.send_json(message)
                    except Exception as exc:
                        logger.warning("Error sending to client %s: %s", client, exc)
                        connected_clients.discard(client)

            await asyncio.sleep(2 / max(0.1, simulation_engine.simulation_speed))

        except Exception as e:
            logger.exception("Simulation loop error: %s", e)
            await _broadcast_error(f"Simulation error: {e}")
            await asyncio.sleep(1)


@app.on_event("startup")
async def startup_event():
    """Start the simulation loop on app startup."""
    # Attempt to restore villages from the database
    try:
        from app.db import get_db, load_villages

        db = next(get_db())
        rows = load_villages(db)
        db.close()
        if rows:
            simulation_engine.restore_from_db(rows)
    except Exception as exc:
        logger.warning("Could not restore state from DB: %s", exc)

    asyncio.create_task(run_simulation())
    logger.info("Simulation loop started")


# ---------- Health / readiness ----------


@app.get("/health")
async def health_check():
    """Health check endpoint — reports model status."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "villages": len(simulation_engine.villages),
        "transfers": len(simulation_engine.transfers),
        "connected_clients": len(connected_clients),
        "model_loaded": forecaster.model is not None,
        "model_path": forecaster.model_path,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Rural Microgrid Energy Management API",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
