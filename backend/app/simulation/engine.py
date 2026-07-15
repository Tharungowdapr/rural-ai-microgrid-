"""Core simulation engine — manages village state, weather, transfers, and alerts."""

import asyncio
import logging
import math
import random
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Optional

from app.data.dataset import (
    VILLAGE_NAMES,
    sample_demand,
    sample_humidity,
    sample_temperature,
    sample_wind_speed,
    solar_factor,
)

logger = logging.getLogger(__name__)

# ---------- Realistic lat/lng for rural India (Madhya Pradesh / Rajasthan border area) ----------
VILLAGE_COORDS = [
    (23.1100, 77.5600),  # Barkheda — SE of Bhopal
    (23.3300, 77.5900),  # Raisen — east
    (23.1800, 77.4600),  # Mandideep — south
    (23.3500, 77.3100),  # Obaidullaganj — NW
    (23.4800, 77.7400),  # Sanchi — far NE
    (23.1200, 77.7800),  # Begumganj — far SE
    (23.4500, 77.1000),  # Narsinghgarh — far W
    (23.0900, 77.2700),  # Rajnandgaon — SW
    (23.0200, 77.5800),  # Biaora — south-east
    (23.4000, 77.8300),  # Nasrullaganj — far east
    (23.2100, 77.1500),  # Sultanpur — west
    (23.5300, 77.4800),  # Bhaurasa — north
    (23.2700, 77.3800),  # Pipalpani — central-west
    (23.1500, 77.7000),  # Goharganj — east
    (23.5200, 77.6800),  # Basoda — NE
    (22.9500, 77.4200),  # Garhi — far south
    (23.3900, 77.2500),  # Shahpura — NW
    (23.4700, 77.6200),  # Udaipura — NE
    (23.0500, 77.3500),  # Baraily — SW
    (23.3100, 77.9200),  # Mandla — far east
]


class VillageStatus(str, Enum):
    SURPLUS = "SURPLUS"
    BALANCED = "BALANCED"
    WARNING = "WARNING"
    DEFICIT = "DEFICIT"


@dataclass
class Village:
    id: str
    name: str
    soc: float = 50.0
    solarGeneration: float = 0.0
    demand: float = 0.0
    status: VillageStatus = VillageStatus.BALANCED
    temperature: float = 25.0
    frequency: float = 50.0
    criticalLoad: float = 0.0
    standardLoad: float = 0.0
    x: float = 0.0
    y: float = 0.0
    maxCapacity: float = 500.0
    chargingRate: float = 0.1
    degradation: float = 0.0
    standardShedPercentage: float = 0.0
    criticalShedPercentage: float = 0.0
    hospitalDemand: float = 30.0
    waterPumpDemand: float = 20.0
    residentialDemand: float = 50.0
    schoolDemand: float = 25.0
    emergencySpike: float = 0.0
    solarPanelCapacity: float = 300.0
    lat: float = 0.0
    lng: float = 0.0

    def dict(self):
        return {
            **asdict(self),
            "status": self.status.value if isinstance(self.status, VillageStatus) else self.status,
        }


@dataclass
class Transfer:
    id: str
    source: str
    destination: str
    rate: float  # kW
    efficiency: float  # %
    status: str = "ACTIVE"
    relayStatus: str = "ACTIVE"
    startTime: float = field(default_factory=lambda: datetime.now().timestamp() * 1000)

    def dict(self):
        return asdict(self)


@dataclass
class Alert:
    id: str
    type: str  # CRITICAL, WARNING, INFO, AI, EMS
    message: str
    timestamp: float = field(default_factory=lambda: datetime.now().timestamp() * 1000)
    severity: int = 1

    def dict(self):
        return asdict(self)


WEATHER_EFFICIENCY = {
    "sunny": 1.0,
    "partly_cloudy": 0.7,
    "cloudy": 0.4,
    "rainy": 0.2,
    "storm": 0.05,
}

SEASONAL_FACTORS = [0.6, 0.65, 0.75, 0.85, 0.95, 1.0, 1.0, 0.95, 0.85, 0.75, 0.65, 0.6]


@dataclass
class Weather:
    temperature: float = 25.0
    humidity: float = 65.0
    windSpeed: float = 10.0
    cloudCover: float = 30.0
    irradiance: float = 800.0
    hour: int = 12
    condition: str = "partly_cloudy"


class SimulationEngine:
    def __init__(self, num_villages: int = 5):
        self.villages: List[Village] = []
        self.transfers: List[Transfer] = []
        self.alerts: List[Alert] = []
        self.weather = Weather()
        self.simulation_speed = 1.0
        # Start at midday, unpaused for better solar generation during testing
        self.simulation_time = datetime.now().replace(hour=12, minute=0, second=0, microsecond=0)
        self.total_generation = 0.0
        self.total_demand = 0.0
        self.grid_stability = 100.0
        self.active_scenarios = {}
        self.is_paused = False
        self._transfer_id = 0
        self._alert_id = 0

        # Initialize weather with correct simulation time
        self._update_weather()
        self._initialize_villages(num_villages)

    def _initialize_villages(self, num_villages: int):
        """Initialize villages with realistic values from UCI energy dataset."""
        num_villages = max(1, num_villages)
        hour = self.simulation_time.hour

        for i in range(num_villages):
            angle = (i / num_villages) * math.pi * 2
            hosp = 25 + random.uniform(0, 15)
            water = 15 + random.uniform(0, 15)
            resid = 40 + random.uniform(0, 25)
            school = 15 + random.uniform(0, 20)
            base_demand = hosp + water + resid + school

            lat, lng = VILLAGE_COORDS[i] if i < len(VILLAGE_COORDS) else (23.26, 77.41)

            village = Village(
                id=f"village-{i}",
                name=VILLAGE_NAMES[i] if i < len(VILLAGE_NAMES) else f"Village-{chr(65 + i)}",
                x=400 + 150 * math.cos(angle),
                y=300 + 150 * math.sin(angle),
                soc=60 + random.uniform(-15, 15),
                temperature=sample_temperature(hour),
                demand=base_demand,
                criticalLoad=hosp + water,
                standardLoad=resid + school,
                hospitalDemand=round(hosp, 1),
                waterPumpDemand=round(water, 1),
                residentialDemand=round(resid, 1),
                schoolDemand=round(school, 1),
                emergencySpike=0,
                solarPanelCapacity=250 + random.uniform(0, 150),
                lat=lat,
                lng=lng,
            )
            self.villages.append(village)

    def restore_from_db(self, village_rows) -> None:
        """Restore village state from database rows on startup."""
        if not village_rows:
            return
        self.villages.clear()
        for row in village_rows:
            v = Village(
                id=row.id,
                name=row.name,
                soc=row.soc,
                solarGeneration=row.solar_generation,
                demand=row.demand,
                status=VillageStatus(row.status) if row.status in [s.value for s in VillageStatus] else VillageStatus.BALANCED,
                temperature=row.temperature,
                frequency=row.frequency,
                criticalLoad=row.critical_load,
                standardLoad=row.standard_load,
                x=row.x,
                y=row.y,
                maxCapacity=row.max_capacity,
                chargingRate=row.charging_rate,
                degradation=row.degradation,
                standardShedPercentage=row.standard_shed_percentage,
                criticalShedPercentage=row.critical_shed_percentage,
                hospitalDemand=row.hospital_demand,
                waterPumpDemand=row.water_pump_demand,
                residentialDemand=row.residential_demand,
                schoolDemand=row.school_demand,
                emergencySpike=row.emergency_spike,
                solarPanelCapacity=row.solar_panel_capacity,
                lat=getattr(row, "lat", 0.0),
                lng=getattr(row, "lng", 0.0),
            )
            self.villages.append(v)
        logger.info("Restored %d villages from database", len(self.villages))

    async def update(self):
        """Update simulation state (called every cycle)."""
        if not self.is_paused:
            self._update_weather()

            for village in self.villages:
                self._update_solar_generation(village)
                self._update_demand(village)
                self._update_battery(village)
                self._update_frequency(village)
                self._update_status(village)

            self.transfers.clear()
            self.simulation_time += timedelta(seconds=2)
        else:
            for village in self.villages:
                self._update_status(village)

        self._calculate_grid_metrics()

    def _update_weather(self):
        """Simulate weather changes using dataset patterns."""
        hour = self.simulation_time.hour
        month = self.simulation_time.month - 1
        self.weather.hour = hour

        if not hasattr(self, "_weather_change_counter"):
            self._weather_change_counter = 0
        self._weather_change_counter += 1
        if self._weather_change_counter % 30 == 0:
            conditions = list(WEATHER_EFFICIENCY.keys())
            weights = [0.4, 0.3, 0.15, 0.1, 0.05]
            self.weather.condition = random.choices(conditions, weights=weights, k=1)[0]

        cond_eff = WEATHER_EFFICIENCY.get(self.weather.condition, 0.7)
        seasonal = SEASONAL_FACTORS[month]
        base_irradiance = solar_factor(hour) * 1000 * cond_eff * seasonal

        self.weather.temperature = sample_temperature(hour)
        self.weather.humidity = sample_humidity(hour)
        self.weather.windSpeed = sample_wind_speed(hour)
        self.weather.cloudCover = max(0, min(100, self.weather.cloudCover + random.uniform(-2, 2)))
        self.weather.irradiance = base_irradiance * (1 - self.weather.cloudCover / 100)

    def _update_solar_generation(self, village: Village):
        base_irradiance = self.weather.irradiance
        # Panel capacity in kW, irradiance in W/m²
        # Typical solar panel efficiency ~20%, so effective generation:
        generation = (base_irradiance / 1000) * village.solarPanelCapacity * 0.25
        noise = random.uniform(-5, 5)
        village.solarGeneration = max(0, generation + noise)

    def _update_demand(self, village: Village):
        hour = self.simulation_time.hour
        is_school_hour = 7 <= hour <= 16
        is_night = hour <= 5 or hour >= 22

        hosp = village.hospitalDemand * (1.0 if not is_night else 0.8)
        water = village.waterPumpDemand * (1.0 if not is_night else 0.5)
        resid = village.residentialDemand * (0.6 if is_night else (1.2 if 18 <= hour <= 22 else 1.0))
        school = village.schoolDemand if is_school_hour else 0

        noise = random.uniform(-3, 3)
        base_critical = hosp + water
        base_standard = resid + school

        village.criticalLoad = base_critical * (1 - village.criticalShedPercentage / 100)
        village.standardLoad = base_standard * (1 - village.standardShedPercentage / 100)
        village.demand = village.criticalLoad + village.standardLoad + village.emergencySpike + noise

    def _update_battery(self, village: Village):
        """Update battery state of charge."""
        net_power = village.solarGeneration - village.demand
        soc_change = (net_power / village.maxCapacity) * village.chargingRate
        village.soc = max(0, min(100, village.soc + soc_change))

        if village.soc > 90 or village.soc < 10:
            village.degradation = min(100, village.degradation + 0.001)

    def _update_frequency(self, village: Village):
        """Update grid frequency."""
        net_balance = village.solarGeneration - village.demand
        frequency_change = (net_balance / 1000) * 0.5
        village.frequency = max(48, min(52, village.frequency + frequency_change))

    def _update_status(self, village: Village):
        """Determine village status based on SOC and balance."""
        net_power = village.solarGeneration - village.demand

        if village.soc < 30:
            village.status = VillageStatus.DEFICIT
        elif net_power > 50:
            village.status = VillageStatus.SURPLUS
        elif village.soc < 50:
            village.status = VillageStatus.WARNING
        else:
            village.status = VillageStatus.BALANCED

    def _calculate_grid_metrics(self):
        """Calculate grid-wide metrics."""
        self.total_generation = sum(v.solarGeneration for v in self.villages) / 1000
        self.total_demand = sum(v.demand for v in self.villages) / 1000

        avg_frequency = sum(v.frequency for v in self.villages) / len(self.villages) if self.villages else 50.0
        frequency_deviation = abs(50.0 - avg_frequency)

        total_battery_power_mw = sum((v.soc / 100) * v.maxCapacity * 0.2 for v in self.villages) / 1000
        available_power = self.total_generation + total_battery_power_mw

        balance_ratio = min(1.0, available_power / max(self.total_demand, 0.1))

        self.grid_stability = 100 * (1 - frequency_deviation / 5) * balance_ratio
        self.grid_stability = max(0, min(100, self.grid_stability))

    async def create_transfer(self, source_id: str, destination_id: str, rate: float, note: Optional[str] = None):
        """Create a power transfer between two villages."""
        transfer = Transfer(
            id=f"transfer-{self._transfer_id}",
            source=source_id,
            destination=destination_id,
            rate=rate,
            efficiency=96.4,
        )
        self._transfer_id += 1
        self.transfers.append(transfer)

        message = f"Transfer initiated: {source_id} → {destination_id} ({rate:.1f} kW)"
        if note:
            message += f" - {note}"

        alert = Alert(
            id=f"alert-{self._alert_id}",
            type="EMS",
            message=message,
            severity=1,
        )
        self._alert_id += 1
        self.alerts.append(alert)

    async def trigger_scenario(self, scenario_id: str):
        """Trigger a test scenario."""
        alert = None
        if scenario_id == "heatwave":
            self.weather.temperature = 45
            alert = Alert(id=f"alert-{self._alert_id}", type="CRITICAL", message="Heatwave alert: Extreme temperature detected", severity=3)

        elif scenario_id == "cloudcover":
            self.weather.cloudCover = 95
            alert = Alert(id=f"alert-{self._alert_id}", type="WARNING", message="Heavy cloud cover: Solar generation reduced", severity=2)

        elif scenario_id == "hospital-surge":
            hospital = self.villages[0] if self.villages else None
            if hospital:
                hospital.demand += 100
                alert = Alert(id=f"alert-{self._alert_id}", type="CRITICAL", message=f"Hospital surge: Demand increased at {hospital.name}", severity=3)

        elif scenario_id == "relay-failure":
            alert = Alert(id=f"alert-{self._alert_id}", type="CRITICAL", message="Relay R-014 failed: Rerouting power transfers", severity=3)

        elif scenario_id == "blackout":
            if self.villages:
                affected_village = random.choice(self.villages)
                affected_village.solarGeneration = 0
                affected_village.soc = 0
                alert = Alert(id=f"alert-{self._alert_id}", type="CRITICAL", message=f"Blackout: {affected_village.name} is offline", severity=3)

        elif scenario_id == "storm":
            self.weather.windSpeed = 80
            self.weather.cloudCover = 100
            alert = Alert(id=f"alert-{self._alert_id}", type="WARNING", message="Storm warning: Extreme weather conditions incoming", severity=2)

        if alert:
            self._alert_id += 1
            self.alerts.append(alert)
