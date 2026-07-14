"""Application configuration loaded from environment variables / .env file."""

from pathlib import Path
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = {"env_file": str(PROJECT_ROOT / ".env"), "env_file_encoding": "utf-8"}

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    # WebSocket
    WS_BROADCAST_INTERVAL_SEC: float = 2.0

    # ML
    MODEL_PATH: str = str(PROJECT_ROOT.parent / "lstm_model.h5")
    SCALER_PATH: str = str(PROJECT_ROOT / "ml" / "scaler.joblib")
    METRICS_PATH: str = str(PROJECT_ROOT / "ml" / "metrics.json")

    # Persistence
    DATABASE_URL: str = "sqlite:///./microgrid.db"

    # Logging
    LOG_LEVEL: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


settings = Settings()
