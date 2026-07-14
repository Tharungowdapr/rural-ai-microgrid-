"""SQLite persistence layer for village state, transfer history, and alerts.

Uses SQLAlchemy async-compatible core.  Tables are created on first import.
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    Integer,
    String,
    Text,
    create_engine,
    desc,
)
from sqlalchemy.orm import Session, sessionmaker, declarative_base

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------- ORM models ----------


class VillageRow(Base):
    __tablename__ = "villages"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    soc = Column(Float, default=50.0)
    solar_generation = Column(Float, default=0.0)
    demand = Column(Float, default=0.0)
    status = Column(String, default="BALANCED")
    temperature = Column(Float, default=25.0)
    frequency = Column(Float, default=50.0)
    critical_load = Column(Float, default=0.0)
    standard_load = Column(Float, default=0.0)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    max_capacity = Column(Float, default=500.0)
    charging_rate = Column(Float, default=0.1)
    degradation = Column(Float, default=0.0)
    standard_shed_percentage = Column(Float, default=0.0)
    critical_shed_percentage = Column(Float, default=0.0)
    hospital_demand = Column(Float, default=30.0)
    water_pump_demand = Column(Float, default=20.0)
    residential_demand = Column(Float, default=50.0)
    school_demand = Column(Float, default=25.0)
    emergency_spike = Column(Float, default=0.0)
    solar_panel_capacity = Column(Float, default=300.0)
    lat = Column(Float, default=0.0)
    lng = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class TransferRow(Base):
    __tablename__ = "transfers"

    id = Column(String, primary_key=True)
    source = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    rate = Column(Float, nullable=False)
    efficiency = Column(Float, nullable=False)
    status = Column(String, default="ACTIVE")
    relay_status = Column(String, default="ACTIVE")
    start_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class AlertRow(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    type = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(Float, nullable=False)
    severity = Column(Integer, default=1)


class HistoryRow(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    village_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    demand = Column(Float, default=0.0)
    solar_generation = Column(Float, default=0.0)
    soc = Column(Float, default=0.0)
    temperature = Column(Float, default=0.0)
    humidity = Column(Float, default=0.0)
    wind_speed = Column(Float, default=0.0)
    cloud_cover = Column(Float, default=0.0)


# ---------- helpers ----------

Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def save_village(db: Session, v) -> None:
    """Upsert a single village from an engine Village dataclass."""
    row = db.get(VillageRow, v.id)
    data = {
        "name": v.name,
        "soc": v.soc,
        "solar_generation": v.solarGeneration,
        "demand": v.demand,
        "status": v.status.value if hasattr(v.status, "value") else v.status,
        "temperature": v.temperature,
        "frequency": v.frequency,
        "critical_load": v.criticalLoad,
        "standard_load": v.standardLoad,
        "x": v.x,
        "y": v.y,
        "max_capacity": v.maxCapacity,
        "charging_rate": v.chargingRate,
        "degradation": v.degradation,
        "standard_shed_percentage": v.standardShedPercentage,
        "critical_shed_percentage": v.criticalShedPercentage,
        "hospital_demand": v.hospitalDemand,
        "water_pump_demand": v.waterPumpDemand,
        "residential_demand": v.residentialDemand,
        "school_demand": v.schoolDemand,
        "emergency_spike": v.emergencySpike,
        "solar_panel_capacity": v.solarPanelCapacity,
        "lat": getattr(v, "lat", 0.0),
        "lng": getattr(v, "lng", 0.0),
        "updated_at": datetime.utcnow(),
    }
    if row:
        for k, val in data.items():
            setattr(row, k, val)
    else:
        row = VillageRow(id=v.id, **data)
        db.add(row)


def save_villages(db: Session, villages) -> None:
    for v in villages:
        save_village(db, v)
    db.commit()


def load_villages(db: Session) -> list:
    return db.query(VillageRow).all()


def save_transfer(db: Session, t) -> None:
    row = db.get(TransferRow, t.id)
    if row:
        return
    db.add(TransferRow(
        id=t.id,
        source=t.source,
        destination=t.destination,
        rate=t.rate,
        efficiency=t.efficiency,
        status=t.status,
        relay_status=t.relayStatus,
        start_time=t.startTime,
    ))
    db.commit()


def save_alert(db: Session, a) -> None:
    row = db.get(AlertRow, a.id)
    if row:
        return
    db.add(AlertRow(
        id=a.id,
        type=a.type,
        message=a.message,
        timestamp=a.timestamp,
        severity=a.severity,
    ))
    db.commit()


def get_history(db: Session, village_id: str, hours: int = 24) -> list:
    since = datetime.utcnow() - timedelta(hours=hours)
    return (
        db.query(HistoryRow)
        .filter(HistoryRow.village_id == village_id, HistoryRow.timestamp >= since)
        .order_by(HistoryRow.timestamp)
        .all()
    )


def record_history(db: Session, village, weather) -> None:
    """Record a snapshot for LSTM input history."""
    db.add(HistoryRow(
        village_id=village.id,
        timestamp=datetime.utcnow(),
        demand=village.demand,
        solar_generation=village.solarGeneration,
        soc=village.soc,
        temperature=village.temperature,
        humidity=weather.humidity if weather else 0.0,
        wind_speed=weather.windSpeed if weather else 0.0,
        cloud_cover=weather.cloudCover if weather else 0.0,
    ))
    # Keep last 7 days only
    cutoff = datetime.utcnow() - timedelta(days=7)
    db.query(HistoryRow).filter(HistoryRow.timestamp < cutoff).delete()
    db.commit()
