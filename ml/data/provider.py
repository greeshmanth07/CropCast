"""
Data Provider Layer for AgriMarket Price Intelligence.
Provides raw historical time series with multi-source prices, market arrivals, and weather observations.
"""
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
import math
import numpy as np
import pandas as pd


class BaseDataProvider(ABC):
    """Abstract interface for all crop market data providers."""

    @abstractmethod
    def get_historical_market_data(self, crop: str, market: str, days: int = 90) -> pd.DataFrame:
        """
        Fetch historical records for a given crop and market.
        Returns a DataFrame containing dates, multi-source prices, arrivals, and weather.
        """
        pass

    @abstractmethod
    def get_all_supported_crops_and_markets(self) -> dict:
        """Return a mapping of supported crops to their associated markets."""
        pass


class SampleDataProvider(BaseDataProvider):
    """
    Sample Demonstration Data Provider.
    Generates realistic, deterministic 120-day historical time-series data
    incorporating seasonal cycles, mandi arrival shocks, weather effects, and multi-source price spreads.
    Explicitly labeled as demonstration data for testing the end-to-end ML pipeline.
    """

    PROVIDER_TYPE = "sample_demonstration_data"

    CROP_BASELINES = {
        "Tomato": {"base_price": 2850, "volatility": 0.045, "arrivals": 450, "perishable": True},
        "Rice": {"base_price": 2360, "volatility": 0.015, "arrivals": 1200, "perishable": False},
        "Maize": {"base_price": 2240, "volatility": 0.020, "arrivals": 850, "perishable": False},
        "Chilli": {"base_price": 11200, "volatility": 0.035, "arrivals": 320, "perishable": False},
        "Onion": {"base_price": 2490, "volatility": 0.040, "arrivals": 600, "perishable": True},
        "Potato": {"base_price": 1760, "volatility": 0.025, "arrivals": 750, "perishable": True},
        "Cotton": {"base_price": 7280, "volatility": 0.022, "arrivals": 500, "perishable": False},
        "Turmeric": {"base_price": 12800, "volatility": 0.030, "arrivals": 280, "perishable": False},
    }

    MARKET_OFFSETS = {
        "Guntur": 1.00,
        "Tenali": 0.98,
        "Vijayawada": 1.03,
        "Visakhapatnam": 1.05,
        "Kurnool": 0.97,
        "Narasaraopet": 0.96,
        "Chilakaluripet": 0.97,
        "Khammam": 1.01,
        "Warangal": 0.99,
        "Nandyal": 0.97,
        "Adoni": 0.98,
        "Eluru": 1.01,
        "Duggirala": 1.02,
        "Nizamabad": 1.00,
        "Erode": 1.04,
    }

    def __init__(self, seed: int = 42):
        self.seed = seed

    def get_all_supported_crops_and_markets(self) -> dict:
        return {
            "Tomato": ["Guntur", "Tenali", "Vijayawada", "Visakhapatnam"],
            "Rice": ["Guntur", "Tenali", "Vijayawada"],
            "Maize": ["Narasaraopet", "Guntur", "Chilakaluripet"],
            "Chilli": ["Guntur", "Khammam", "Warangal"],
            "Onion": ["Kurnool", "Guntur", "Nandyal"],
            "Potato": ["Vijayawada", "Guntur", "Eluru"],
            "Cotton": ["Adoni", "Guntur", "Warangal"],
            "Turmeric": ["Duggirala", "Nizamabad", "Erode"],
        }

    def get_historical_market_data(self, crop: str, market: str, days: int = 120) -> pd.DataFrame:
        crop_clean = crop.strip().capitalize()
        config = self.CROP_BASELINES.get(crop_clean, {"base_price": 2500, "volatility": 0.03, "arrivals": 500, "perishable": False})
        market_mult = self.MARKET_OFFSETS.get(market.strip().capitalize(), 1.00)

        # Deterministic generation per crop-market
        hash_seed = abs(hash(f"{crop_clean}_{market}_{self.seed}")) % 100000
        rng = np.random.default_rng(hash_seed)

        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days - 1)
        date_range = [start_date + timedelta(days=i) for i in range(days)]

        records = []
        base = config["base_price"] * market_mult
        current_price = base * 0.92  # start slightly lower

        for i, dt in enumerate(date_range):
            day_of_year = dt.timetuple().tm_yday
            day_of_week = dt.weekday()

            # Seasonal oscillation + weekly mandi cycle (Sunday arrivals low, Thursdays high)
            seasonal_factor = 1.0 + 0.08 * math.sin(2 * math.pi * day_of_year / 365.25)
            weekend_dip = -0.015 if day_of_week in (5, 6) else 0.01

            # Weather simulation
            rainfall = max(0.0, float(rng.exponential(scale=2.5) if rng.random() > 0.70 else 0.0))
            temp_max = float(32.0 + 4.0 * math.sin(2 * math.pi * day_of_year / 365) + rng.normal(0, 1.5))
            temp_min = float(temp_max - 8.5 + rng.normal(0, 0.8))
            humidity = float(np.clip(65.0 + rainfall * 3.5 + rng.normal(0, 4.0), 30.0, 95.0))

            # Supply arrival dynamics (rain delays arrivals -> pushes price up)
            rain_impact = 1.0 - (rainfall / 50.0) if rainfall > 5 else 1.0
            base_arrival = config["arrivals"] * (0.8 + 0.4 * rng.random()) * rain_impact
            arrivals_quintals = max(50.0, float(round(base_arrival, 1)))

            # Mean-reverting random walk for modal price
            drift = (base * seasonal_factor - current_price) * 0.06
            shock = rng.normal(0, config["volatility"] * base)
            arrival_pressure = (config["arrivals"] - arrivals_quintals) / config["arrivals"] * 0.02 * base

            current_price = max(base * 0.45, current_price + drift + shock + arrival_pressure + (weekend_dip * base))

            # Simulate 4 independent reporting sources around the modal market price
            source_agmarknet = round(current_price * (1.0 + rng.normal(0, 0.012)), 2)
            source_enam = round(current_price * (1.0 + rng.normal(0, 0.015)), 2)
            source_local_mandi = round(current_price * (1.0 + rng.normal(0, 0.020)), 2)
            source_fpo_pool = round(current_price * (1.0 + rng.normal(0, 0.018)), 2)

            records.append({
                "date": dt.strftime("%Y-%m-%d"),
                "crop": crop_clean,
                "market": market.strip().capitalize(),
                "price_agmarknet": max(100.0, source_agmarknet),
                "price_enam": max(100.0, source_enam),
                "price_local_mandi": max(100.0, source_local_mandi),
                "price_fpo_pool": max(100.0, source_fpo_pool),
                "arrivals_quintals": arrivals_quintals,
                "rainfall_mm": round(rainfall, 1),
                "temp_max_c": round(temp_max, 1),
                "temp_min_c": round(temp_min, 1),
                "humidity_pct": round(humidity, 1),
                "data_source": self.PROVIDER_TYPE,
            })

        df = pd.DataFrame(records)
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date").reset_index(drop=True)
        return df


def get_default_provider() -> BaseDataProvider:
    """Factory method returning the default active data provider."""
    return SampleDataProvider()
