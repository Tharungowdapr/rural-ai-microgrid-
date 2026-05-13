from fastapi import APIRouter, HTTPException
from typing import List

router = APIRouter(prefix="/api", tags=["api"])

# These routes are placeholders and will be fully implemented
# Most functionality is handled through WebSocket

@router.get("/villages")
async def get_villages():
    """Get current village states"""
    return {"message": "Use WebSocket for real-time updates"}

@router.get("/villages/{village_id}")
async def get_village(village_id: str):
    """Get specific village details"""
    return {"village_id": village_id, "message": "Use WebSocket for real-time updates"}

@router.get("/transfers")
async def get_transfers():
    """Get active power transfers"""
    return {"message": "Use WebSocket for real-time updates"}

@router.get("/alerts")
async def get_alerts():
    """Get system alerts"""
    return {"message": "Use WebSocket for real-time updates"}

@router.get("/forecast")
async def get_forecast():
    """Get AI forecast data"""
    return {"message": "Use WebSocket for real-time updates"}

@router.post("/scenario/{scenario_id}")
async def trigger_scenario(scenario_id: str):
    """Manually trigger a test scenario"""
    valid_scenarios = [
        "heatwave",
        "cloudcover",
        "relay-failure",
        "hospital-surge",
        "blackout",
        "storm",
    ]
    
    if scenario_id not in valid_scenarios:
        raise HTTPException(status_code=400, detail=f"Invalid scenario: {scenario_id}")
    
    return {"scenario": scenario_id, "status": "triggered"}

@router.post("/control/simulation/pause")
async def pause_simulation():
    """Pause the simulation"""
    return {"status": "paused"}

@router.post("/control/simulation/resume")
async def resume_simulation():
    """Resume the simulation"""
    return {"status": "resumed"}

@router.post("/control/simulation/speed/{speed}")
async def set_simulation_speed(speed: float):
    """Set simulation speed multiplier"""
    if speed < 0.5 or speed > 4:
        raise HTTPException(status_code=400, detail="Speed must be between 0.5 and 4")
    
    return {"speed": speed}

@router.post("/control/transfer/{village_id}/request")
async def request_transfer(village_id: str, amount: float):
    """Request power transfer for a village"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    return {"village": village_id, "amount": amount, "status": "requested"}

@router.post("/control/load/{village_id}/shed")
async def shed_load(village_id: str, percentage: float):
    """Manually shed load for a village"""
    if percentage < 0 or percentage > 100:
        raise HTTPException(status_code=400, detail="Percentage must be between 0 and 100")
    
    return {"village": village_id, "shed_percentage": percentage, "status": "executed"}
