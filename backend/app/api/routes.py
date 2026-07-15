"""REST API routes for the Rural Microgrid simulation."""

import logging
import random
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.dependencies import ems_controller, forecaster, simulation_engine
from app.simulation.engine import Alert

logger = logging.getLogger(__name__)


# ---------- Request models with validation ----------


class WeatherUpdate(BaseModel):
    temperature: Optional[float] = Field(None, ge=-50, le=60)
    humidity: Optional[float] = Field(None, ge=0, le=100)
    windSpeed: Optional[float] = Field(None, ge=0, le=200)
    cloudCover: Optional[float] = Field(None, ge=0, le=100)
    irradiance: Optional[float] = Field(None, ge=0, le=1500)
    dayTimeHour: Optional[int] = Field(None, ge=0, le=23)
    condition: Optional[str] = None


class VillageUpdate(BaseModel):
    soc: Optional[float] = Field(None, ge=0, le=100)
    demand: Optional[float] = Field(None, ge=0)
    solarGeneration: Optional[float] = Field(None, ge=0)
    criticalLoad: Optional[float] = Field(None, ge=0)
    standardLoad: Optional[float] = Field(None, ge=0)
    hospitalDemand: Optional[float] = Field(None, ge=0)
    waterPumpDemand: Optional[float] = Field(None, ge=0)
    residentialDemand: Optional[float] = Field(None, ge=0)
    schoolDemand: Optional[float] = Field(None, ge=0)
    emergencySpike: Optional[float] = Field(None, ge=0)
    solarPanelCapacity: Optional[float] = Field(None, ge=0)
    chargingRate: Optional[float] = Field(None, ge=0, le=1)
    temperature: Optional[float] = Field(None, ge=-50, le=60)


class VillageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=40)
    lat: float = Field(..., ge=0, le=90)
    lng: float = Field(..., ge=-180, le=180)
    soc: float = Field(50.0, ge=0, le=100)
    solarPanelCapacity: float = Field(300.0, ge=0, le=2000)
    maxCapacity: float = Field(500.0, ge=50, le=5000)
    chargingRate: float = Field(0.1, ge=0, le=1)
    hospitalDemand: float = Field(30.0, ge=0)
    waterPumpDemand: float = Field(20.0, ge=0)
    residentialDemand: float = Field(50.0, ge=0)
    schoolDemand: float = Field(25.0, ge=0)
    emergencySpike: float = Field(0.0, ge=0)
    temperature: float = Field(28.0, ge=-50, le=60)


router = APIRouter(prefix="/api", tags=["api"])


@router.get("/villages")
async def get_villages():
    return [v.dict() for v in simulation_engine.villages]


@router.post("/villages")
async def create_village(body: VillageCreate):
    """Add a new village at a specific lat/lng with full parameter control."""
    from app.simulation.engine import Village, VillageStatus

    idx = len(simulation_engine.villages)
    base_demand = body.hospitalDemand + body.waterPumpDemand + body.residentialDemand + body.schoolDemand
    critical = body.hospitalDemand + body.waterPumpDemand
    standard = body.residentialDemand + body.schoolDemand

    village = Village(
        id=f"village-{idx}",
        name=body.name,
        soc=body.soc,
        solarGeneration=0,
        demand=base_demand,
        status=VillageStatus.BALANCED,
        temperature=body.temperature,
        frequency=50.0,
        criticalLoad=critical,
        standardLoad=standard,
        x=400 + 100 * (idx % 4),
        y=200 + 100 * (idx // 4),
        maxCapacity=body.maxCapacity,
        chargingRate=body.chargingRate,
        degradation=0,
        hospitalDemand=body.hospitalDemand,
        waterPumpDemand=body.waterPumpDemand,
        residentialDemand=body.residentialDemand,
        schoolDemand=body.schoolDemand,
        emergencySpike=body.emergencySpike,
        solarPanelCapacity=body.solarPanelCapacity,
        lat=body.lat,
        lng=body.lng,
    )
    simulation_engine.villages.append(village)
    logger.info("Created village %s at (%.4f, %.4f)", village.name, village.lat, village.lng)
    return village.dict()


@router.get("/villages/{village_id}")
async def get_village(village_id: str):
    village = next((v for v in simulation_engine.villages if v.id == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    return village.dict()


@router.get("/transfers")
async def get_transfers():
    return [t.dict() for t in simulation_engine.transfers]


@router.get("/alerts")
async def get_alerts():
    return [a.dict() for a in simulation_engine.alerts]


@router.get("/forecast")
async def get_forecast():
    forecasts = await forecaster.predict(
        simulation_engine.villages,
        simulation_engine.weather,
    )
    return forecasts


@router.post("/scenario/{scenario_id}")
async def trigger_scenario(scenario_id: str):
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
    await simulation_engine.trigger_scenario(scenario_id)
    return {"scenario": scenario_id, "status": "triggered"}


@router.post("/control/simulation/pause")
async def pause_simulation():
    simulation_engine.is_paused = True
    return {"status": "paused"}


@router.post("/control/simulation/resume")
async def resume_simulation():
    simulation_engine.is_paused = False
    return {"status": "resumed"}


@router.post("/simulation/start")
async def start_simulation():
    simulation_engine.is_paused = False
    simulation_engine.simulation_speed = 1.0
    return {"status": "started"}


@router.post("/simulation/stop")
async def stop_simulation():
    simulation_engine.is_paused = True
    return {"status": "stopped"}


@router.post("/simulation/toggle")
async def toggle_simulation():
    simulation_engine.is_paused = not simulation_engine.is_paused
    return {"paused": simulation_engine.is_paused}


@router.post("/simulation/randomize")
async def randomize_simulation():
    conditions = ["sunny", "partly_cloudy", "cloudy", "rainy", "storm"]
    for v in simulation_engine.villages:
        v.soc = round(random.uniform(20, 95), 1)
        v.hospitalDemand = round(random.uniform(15, 50), 1)
        v.waterPumpDemand = round(random.uniform(10, 35), 1)
        v.residentialDemand = round(random.uniform(30, 80), 1)
        v.schoolDemand = round(random.uniform(10, 40), 1)
        v.emergencySpike = 0
        v.solarPanelCapacity = round(random.uniform(200, 400), 1)
        v.temperature = round(random.uniform(5, 35), 1)
        v.chargingRate = round(random.uniform(0.05, 0.2), 2)

    simulation_engine.weather.condition = random.choice(conditions)
    simulation_engine.weather.cloudCover = round(random.uniform(0, 100), 1)
    simulation_engine.weather.temperature = round(random.uniform(5, 35), 1)
    simulation_engine.weather.humidity = round(random.uniform(30, 95), 1)
    simulation_engine.weather.windSpeed = round(random.uniform(0, 15), 1)

    hour = random.randint(0, 23)
    simulation_engine.simulation_time = simulation_engine.simulation_time.replace(hour=hour)

    return {"status": "randomized"}


@router.post("/control/simulation/speed/{speed}")
async def set_simulation_speed(speed: float):
    if speed < 0 or speed > 4:
        raise HTTPException(status_code=400, detail="Speed must be between 0 and 4")
    simulation_engine.simulation_speed = speed
    return {"speed": speed}


@router.post("/control/transfer/request")
async def request_transfer(source_id: str, destination_id: str, amount: float):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    await simulation_engine.create_transfer(source_id, destination_id, amount)
    return {"source": source_id, "destination": destination_id, "amount": amount, "status": "requested"}


@router.post("/control/load/{village_id}/shed")
async def shed_load(village_id: str, percentage: float):
    if percentage < 0 or percentage > 100:
        raise HTTPException(status_code=400, detail="Percentage must be between 0 and 100")
    village = next((v for v in simulation_engine.villages if v.id == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    village.standardShedPercentage = min(100, percentage)
    return {"village": village_id, "shed_percentage": percentage, "status": "executed"}


@router.post("/control/emergency/{village_id}")
async def trigger_emergency_spike(village_id: str, spike_kw: float = 80):
    village = next((v for v in simulation_engine.villages if v.id == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    village.emergencySpike = max(0, spike_kw)
    alert = Alert(
        id=f"emergency-{simulation_engine._alert_id}",
        type="CRITICAL",
        message=f"Emergency spike triggered at {village.name}: +{spike_kw:.0f} kW",
        severity=3,
    )
    simulation_engine._alert_id += 1
    simulation_engine.alerts.append(alert)
    return {"status": "emergency_spike_set", "village": village_id, "spike_kw": spike_kw}


@router.put("/weather")
async def update_weather(weather_update: WeatherUpdate):
    if weather_update.temperature is not None:
        simulation_engine.weather.temperature = weather_update.temperature
    if weather_update.humidity is not None:
        simulation_engine.weather.humidity = weather_update.humidity
    if weather_update.windSpeed is not None:
        simulation_engine.weather.windSpeed = weather_update.windSpeed
    if weather_update.cloudCover is not None:
        simulation_engine.weather.cloudCover = weather_update.cloudCover
    if weather_update.irradiance is not None:
        simulation_engine.weather.irradiance = weather_update.irradiance
    if weather_update.dayTimeHour is not None:
        current = simulation_engine.simulation_time
        simulation_engine.simulation_time = current.replace(hour=int(weather_update.dayTimeHour) % 24)
    if weather_update.condition is not None:
        simulation_engine.weather.condition = weather_update.condition
    return {"status": "success"}


@router.put("/villages/{village_id}")
async def update_village_params(village_id: str, village_update: VillageUpdate):
    village = next((v for v in simulation_engine.villages if v.id == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")

    fields = {
        "soc": "soc",
        "demand": "demand",
        "solarGeneration": "solarGeneration",
        "criticalLoad": "criticalLoad",
        "standardLoad": "standardLoad",
        "hospitalDemand": "hospitalDemand",
        "waterPumpDemand": "waterPumpDemand",
        "residentialDemand": "residentialDemand",
        "schoolDemand": "schoolDemand",
        "emergencySpike": "emergencySpike",
        "solarPanelCapacity": "solarPanelCapacity",
        "chargingRate": "chargingRate",
        "temperature": "temperature",
    }
    for field, attr in fields.items():
        val = getattr(village_update, field, None)
        if val is not None:
            setattr(village, attr, val)

    return village.dict()


@router.delete("/villages/{village_id}")
async def delete_village(village_id: str):
    """Remove a village from the microgrid."""
    idx = next((i for i, v in enumerate(simulation_engine.villages) if v.id == village_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Village not found")
    removed = simulation_engine.villages.pop(idx)
    logger.info("Deleted village %s", removed.name)
    return {"status": "deleted", "village_id": village_id, "villages": [v.dict() for v in simulation_engine.villages]}


@router.post("/village/{village_id}/infrastructure")
async def update_infrastructure(
    village_id: str,
    hospital: Optional[float] = None,
    water_pump: Optional[float] = None,
    residential: Optional[float] = None,
    school: Optional[float] = None,
):
    village = next((v for v in simulation_engine.villages if v.id == village_id), None)
    if not village:
        raise HTTPException(status_code=404, detail="Village not found")
    if hospital is not None:
        village.hospitalDemand = max(0, hospital)
    if water_pump is not None:
        village.waterPumpDemand = max(0, water_pump)
    if residential is not None:
        village.residentialDemand = max(0, residential)
    if school is not None:
        village.schoolDemand = max(0, school)
    return village.dict()


@router.get("/history/{village_id}")
async def get_history(village_id: str, hours: int = 24):
    """Return rolling window of demand/generation/SOC for LSTM input."""
    from app.db import get_db, get_history

    db = next(get_db())
    try:
        rows = get_history(db, village_id, hours)
        return [
            {
                "village_id": r.village_id,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "demand": r.demand,
                "solar_generation": r.solar_generation,
                "soc": r.soc,
                "temperature": r.temperature,
                "humidity": r.humidity,
                "wind_speed": r.wind_speed,
                "cloud_cover": r.cloud_cover,
            }
            for r in rows
        ]
    finally:
        db.close()


@router.get("/metrics/model")
async def get_model_metrics():
    """Return current model training metrics (MAE/RMSE/MAPE)."""
    import json
    from pathlib import Path

    from app.config import settings

    metrics_path = Path(settings.METRICS_PATH)
    if metrics_path.exists():
        with open(metrics_path) as f:
            return json.load(f)
    return {"error": "No metrics available — model not trained yet"}


class VillageCountUpdate(BaseModel):
    count: int = Field(..., ge=1, le=20)


@router.post("/villages/count")
async def set_village_count(update: VillageCountUpdate):
    """Reconfigure the microgrid with a different number of villages."""
    target = update.count
    current = len(simulation_engine.villages)

    if target == current:
        return {"count": current, "status": "unchanged"}

    if target > current:
        import math
        import random as _rand
        from app.data.dataset import VILLAGE_NAMES, sample_temperature, sample_humidity

        existing = set(v.id for v in simulation_engine.villages)
        hour = simulation_engine.simulation_time.hour
        total = target

        for i in range(current, target):
            angle = (i / total) * math.pi * 2
            hosp = 25 + _rand.uniform(0, 15)
            water = 15 + _rand.uniform(0, 15)
            resid = 40 + _rand.uniform(0, 25)
            school = 15 + _rand.uniform(0, 20)

            from app.simulation.engine import Village, VillageStatus
            from app.simulation.engine import VILLAGE_COORDS

            lat, lng = VILLAGE_COORDS[i] if i < len(VILLAGE_COORDS) else (
                23.26 + _rand.uniform(-0.3, 0.3),
                77.41 + _rand.uniform(-0.3, 0.3),
            )

            village = Village(
                id=f"village-{i}",
                name=VILLAGE_NAMES[i] if i < len(VILLAGE_NAMES) else f"Village-{i}",
                x=400 + 150 * math.cos(angle),
                y=300 + 150 * math.sin(angle),
                soc=60 + _rand.uniform(-15, 15),
                temperature=sample_temperature(hour),
                demand=hosp + water + resid + school,
                criticalLoad=hosp + water,
                standardLoad=resid + school,
                hospitalDemand=round(hosp, 1),
                waterPumpDemand=round(water, 1),
                residentialDemand=round(resid, 1),
                schoolDemand=round(school, 1),
                solarPanelCapacity=250 + _rand.uniform(0, 150),
                lat=lat,
                lng=lng,
            )
            simulation_engine.villages.append(village)
    else:
        simulation_engine.villages = simulation_engine.villages[:target]

    return {
        "count": len(simulation_engine.villages),
        "status": "updated",
        "villages": [v.dict() for v in simulation_engine.villages],
    }
