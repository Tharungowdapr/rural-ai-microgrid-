import asyncio
from dataclasses import dataclass, field, asdict
from typing import List, Optional
from datetime import datetime, timedelta
import math
import random
from enum import Enum

class VillageStatus(str, Enum):
    SURPLUS = "SURPLUS"
    BALANCED = "BALANCED"
    WARNING = "WARNING"
    DEFICIT = "DEFICIT"

@dataclass
class Village:
    id: str
    name: str
    soc: float = 50.0  # State of Charge (0-100)
    solarGeneration: float = 0.0  # kW
    demand: float = 0.0  # kW
    status: VillageStatus = VillageStatus.BALANCED
    temperature: float = 25.0  # Celsius
    frequency: float = 50.0  # Hz
    criticalLoad: float = 0.0  # kW
    standardLoad: float = 0.0  # kW
    x: float = 0.0
    y: float = 0.0
    maxCapacity: float = 500.0  # kWh battery capacity
    chargingRate: float = 0.1  # % per update
    degradation: float = 0.0  # Battery degradation %
    
    def dict(self):
        return {
            **asdict(self),
            "status": self.status.value if isinstance(self.status, VillageStatus) else self.status,
            "soc": round(self.soc, 2),
            "solarGeneration": round(self.solarGeneration, 2),
            "demand": round(self.demand, 2),
            "temperature": round(self.temperature, 2),
            "frequency": round(self.frequency, 2),
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

@dataclass
class Weather:
    temperature: float = 25.0
    humidity: float = 65.0
    windSpeed: float = 10.0
    cloudCover: float = 30.0  # 0-100%
    irradiance: float = 800.0  # W/m²

class SimulationEngine:
    def __init__(self, num_villages: int = 8):
        self.villages: List[Village] = []
        self.transfers: List[Transfer] = []
        self.alerts: List[Alert] = []
        self.weather = Weather()
        self.simulation_speed = 1.0
        self.simulation_time = datetime.now()
        self.total_generation = 0.0
        self.total_demand = 0.0
        self.grid_stability = 100.0
        self.active_scenarios = {}
        
        self._initialize_villages(num_villages)
    
    def _initialize_villages(self, num_villages: int):
        """Initialize villages in concentric circles"""
        hub_count = 3
        outpost_count = num_villages - hub_count
        
        # Create hubs (inner circle)
        for i in range(hub_count):
            angle = (i / hub_count) * math.pi * 2
            village = Village(
                id=f"hub-{i}",
                name=f"Hub-{chr(65 + i)}",
                x=400 + 100 * math.cos(angle),
                y=300 + 100 * math.sin(angle),
                soc=75 + random.uniform(-10, 10),
                temperature=20 + random.uniform(-5, 10),
            )
            self.villages.append(village)
        
        # Create outposts (outer circle)
        for i in range(outpost_count):
            angle = (i / outpost_count) * math.pi * 2
            village = Village(
                id=f"outpost-{i}",
                name=f"Village-{chr(65 + hub_count + i)}",
                x=400 + 200 * math.cos(angle),
                y=300 + 200 * math.sin(angle),
                soc=60 + random.uniform(-15, 15),
                temperature=22 + random.uniform(-5, 15),
            )
            self.villages.append(village)
    
    async def update(self):
        """Update simulation state (called every cycle)"""
        # Update weather
        self._update_weather()
        
        # Update each village
        for village in self.villages:
            # Calculate solar generation based on weather
            self._update_solar_generation(village)
            
            # Calculate demand (residential + hospital loads)
            self._update_demand(village)
            
            # Update battery SOC
            self._update_battery(village)
            
            # Update frequency
            self._update_frequency(village)
            
            # Determine status
            self._update_status(village)
        
        # Update grid metrics
        self._calculate_grid_metrics()
        
        # Remove completed transfers
        self.transfers = [t for t in self.transfers if t.status == "ACTIVE"]
        
        self.simulation_time += timedelta(seconds=2)
    
    def _update_weather(self):
        """Simulate weather changes"""
        hour = self.simulation_time.hour
        
        # Realistic solar irradiance based on time of day
        if 6 <= hour < 18:
            peak_irradiance = 1000
            time_factor = math.sin((hour - 6) / 12 * math.pi)
            self.weather.irradiance = peak_irradiance * time_factor
        else:
            self.weather.irradiance = 0
        
        # Random cloud cover changes
        self.weather.cloudCover = max(0, min(100, self.weather.cloudCover + random.uniform(-2, 2)))
        
        # Adjust irradiance based on cloud cover
        self.weather.irradiance *= (1 - self.weather.cloudCover / 100)
    
    def _update_solar_generation(self, village: Village):
        """Calculate solar generation"""
        # Base generation on irradiance and cloud cover
        base_generation = self.weather.irradiance * 0.3  # 0.3 kW per W/m²
        
        # Add randomness
        noise = random.uniform(-10, 10)
        village.solarGeneration = max(0, base_generation + noise)
    
    def _update_demand(self, village: Village):
        """Calculate village demand"""
        hour = self.simulation_time.hour
        
        # Base demand varies by hour
        if 0 <= hour < 6:
            base_demand = 80  # Night time, low demand
        elif 6 <= hour < 12:
            base_demand = 150  # Morning, increasing
        elif 12 <= hour < 18:
            base_demand = 200  # Afternoon, peak
        else:
            base_demand = 120  # Evening
        
        # Split into critical and standard loads
        village.criticalLoad = base_demand * 0.4  # 40% critical (hospital, etc.)
        village.standardLoad = base_demand * 0.6  # 60% standard (residential)
        
        # Add randomness
        village.demand = base_demand + random.uniform(-20, 20)
    
    def _update_battery(self, village: Village):
        """Update battery state of charge"""
        net_power = village.solarGeneration - village.demand
        
        # Calculate SOC change
        soc_change = (net_power / village.maxCapacity) * village.chargingRate
        village.soc = max(0, min(100, village.soc + soc_change))
        
        # Battery degradation
        if village.soc > 90 or village.soc < 10:
            village.degradation = min(100, village.degradation + 0.001)
    
    def _update_frequency(self, village: Village):
        """Update grid frequency"""
        # Frequency based on balance
        net_balance = village.solarGeneration - village.demand
        frequency_change = (net_balance / 1000) * 0.5
        village.frequency = max(48, min(52, village.frequency + frequency_change))
    
    def _update_status(self, village: Village):
        """Determine village status based on SOC and balance"""
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
        """Calculate grid-wide metrics"""
        self.total_generation = sum(v.solarGeneration for v in self.villages) / 1000  # Convert to MW
        self.total_demand = sum(v.demand for v in self.villages) / 1000  # Convert to MW
        
        # Grid stability based on frequency and balance
        avg_frequency = sum(v.frequency for v in self.villages) / len(self.villages)
        frequency_deviation = abs(50.0 - avg_frequency)
        balance_ratio = min(1.0, self.total_generation / max(self.total_demand, 0.1))
        
        self.grid_stability = 100 * (1 - frequency_deviation / 2) * balance_ratio
        self.grid_stability = max(0, min(100, self.grid_stability))
    
    async def create_transfer(self, source_id: str, destination_id: str, rate: float):
        """Create a power transfer between two villages"""
        transfer = Transfer(
            id=f"transfer-{len(self.transfers)}",
            source=source_id,
            destination=destination_id,
            rate=rate,
            efficiency=96.4,  # Transmission efficiency
        )
        self.transfers.append(transfer)
        
        # Create alert
        alert = Alert(
            id=f"alert-{len(self.alerts)}",
            type="EMS",
            message=f"Transfer initiated: {source_id} → {destination_id} ({rate:.1f} kW)",
            severity=1,
        )
        self.alerts.append(alert)
    
    async def trigger_scenario(self, scenario_id: str):
        """Trigger a test scenario"""
        if scenario_id == "heatwave":
            self.weather.temperature = 45
            alert = Alert(
                id=f"alert-{len(self.alerts)}",
                type="CRITICAL",
                message="Heatwave alert: Extreme temperature detected",
                severity=3,
            )
            self.alerts.append(alert)
        
        elif scenario_id == "cloudcover":
            self.weather.cloudCover = 95
            alert = Alert(
                id=f"alert-{len(self.alerts)}",
                type="WARNING",
                message="Heavy cloud cover: Solar generation reduced",
                severity=2,
            )
            self.alerts.append(alert)
        
        elif scenario_id == "hospital-surge":
            # Increase demand for a hospital node
            hospital = self.villages[0] if self.villages else None
            if hospital:
                hospital.demand += 100
                alert = Alert(
                    id=f"alert-{len(self.alerts)}",
                    type="CRITICAL",
                    message=f"Hospital surge: Demand increased at {hospital.name}",
                    severity=3,
                )
                self.alerts.append(alert)
        
        elif scenario_id == "relay-failure":
            alert = Alert(
                id=f"alert-{len(self.alerts)}",
                type="CRITICAL",
                message="Relay R-014 failed: Rerouting power transfers",
                severity=3,
            )
            self.alerts.append(alert)
        
        elif scenario_id == "blackout":
            if self.villages:
                affected_village = random.choice(self.villages)
                affected_village.solarGeneration = 0
                affected_village.soc = 0
                alert = Alert(
                    id=f"alert-{len(self.alerts)}",
                    type="CRITICAL",
                    message=f"Blackout: {affected_village.name} is offline",
                    severity=3,
                )
                self.alerts.append(alert)
        
        elif scenario_id == "storm":
            self.weather.windSpeed = 80
            self.weather.cloudCover = 100
            alert = Alert(
                id=f"alert-{len(self.alerts)}",
                type="WARNING",
                message="Storm warning: Extreme weather conditions incoming",
                severity=2,
            )
            self.alerts.append(alert)
