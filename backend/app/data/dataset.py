"""Hourly energy statistics from UCI 'Appliances Energy Prediction' dataset
   https://archive.ics.uci.edu/ml/datasets/Appliances+energy+prediction
"""

import random

HOURLY_DEMAND_MEAN = [
    53, 51, 49, 48, 49, 53, 58, 79, 106, 113, 125, 133,
    124, 125, 108, 106, 120, 161, 190, 143, 127, 96, 69, 57,
]

HOURLY_DEMAND_STD = [
    26, 19, 11, 11, 10, 27, 46, 81, 112, 117, 137, 141,
    118, 120, 103, 106, 119, 152, 158, 108, 87, 64, 47, 33,
]

HOURLY_TEMP_MEAN = [
    6.1, 5.8, 5.6, 5.3, 5.0, 4.9, 4.8, 5.0, 5.7, 6.6, 7.6, 8.6,
    9.3, 9.8, 10.2, 10.4, 10.3, 10.0, 9.4, 8.8, 8.1, 7.3, 6.8, 6.4,
]

HOURLY_TEMP_STD = [
    4.6, 4.6, 4.5, 4.5, 4.5, 4.4, 4.4, 4.5, 4.7, 4.8, 4.8, 4.9,
    5.0, 5.1, 5.2, 5.3, 5.6, 5.7, 5.7, 5.7, 5.4, 5.1, 4.8, 4.7,
]

HOURLY_HUMIDITY_MEAN = [
    86, 87, 88, 89, 90, 90, 90, 90, 88, 85, 80, 75,
    71, 69, 67, 66, 66, 68, 70, 73, 77, 80, 83, 85,
]

HOURLY_HUMIDITY_STD = [
    9, 8, 8, 8, 7, 7, 7, 7, 8, 10, 12, 13,
    14, 15, 16, 16, 17, 17, 16, 16, 14, 12, 10, 9,
]

HOURLY_WIND_MEAN = [
    3.6, 3.5, 3.5, 3.5, 3.4, 3.4, 3.4, 3.5, 3.7, 4.0, 4.2, 4.5,
    4.8, 4.9, 5.0, 4.9, 4.9, 4.8, 4.5, 4.1, 3.8, 3.7, 3.6, 3.6,
]

HOURLY_WIND_STD = [
    2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.5, 2.4, 2.4, 2.4, 2.4,
    2.4, 2.5, 2.3, 2.2, 2.2, 2.2, 2.2, 2.3, 2.3, 2.3, 2.4, 2.5,
]

# Solar irradiance proxy (peak solar noon, zero at night)
HOURLY_SOLAR_FACTOR = [
    0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
    0.05, 0.2, 0.45, 0.65, 0.85, 0.95,
    1.0, 0.95, 0.85, 0.65, 0.45, 0.2,
    0.05, 0.0, 0.0, 0.0, 0.0, 0.0,
]

VILLAGE_NAMES = ["Village-A", "Village-B", "Village-C", "Village-D", "Village-E"]


def clamp(value, lo, hi):
    return max(lo, min(hi, value))


def sample_demand(hour: int, scale: float = 1.0) -> float:
    mean = HOURLY_DEMAND_MEAN[hour % 24]
    std = HOURLY_DEMAND_STD[hour % 24]
    return clamp(random.gauss(mean, std * 0.3), mean * 0.3, mean * 3.0) * scale


def sample_temperature(hour: int) -> float:
    mean = HOURLY_TEMP_MEAN[hour % 24]
    std = HOURLY_TEMP_STD[hour % 24]
    return clamp(random.gauss(mean, std * 0.2), -10, 40)


def sample_humidity(hour: int) -> float:
    mean = HOURLY_HUMIDITY_MEAN[hour % 24]
    std = HOURLY_HUMIDITY_STD[hour % 24]
    return clamp(random.gauss(mean, std * 0.3), 10, 100)


def sample_wind_speed(hour: int) -> float:
    mean = HOURLY_WIND_MEAN[hour % 24]
    std = HOURLY_WIND_STD[hour % 24]
    return clamp(random.gauss(mean, std * 0.3), 0, 30)


def solar_factor(hour: int) -> float:
    return HOURLY_SOLAR_FACTOR[hour % 24]


def sample_village_demand(hour: int, village_index: int) -> dict:
    """Return dict with demand, criticalLoad, standardLoad for one village"""
    base_demand = sample_demand(hour, scale=1.0)
    critical_pct = 0.35 + (village_index * 0.05)
    standard_pct = 1.0 - critical_pct
    return {
        "demand": round(base_demand, 1),
        "criticalLoad": round(base_demand * critical_pct, 1),
        "standardLoad": round(base_demand * standard_pct, 1),
    }


def sample_weather(hour: int) -> dict:
    return {
        "temperature": round(sample_temperature(hour), 1),
        "humidity": round(sample_humidity(hour), 1),
        "windSpeed": round(sample_wind_speed(hour), 1),
        "cloudCover": round(random.uniform(10, 95), 1),
        "irradiance": round(solar_factor(hour) * 1000, 1),
    }
