"""
Feature Engineering Layer for Agricultural Price Forecasting.
Calculates strictly causal (no future leakage) time-series features:
lags, multi-source aggregations, rolling statistics, arrival dynamics, and weather features.
"""
import numpy as np
import pandas as pd


class FeatureEngineer:
    """
    Constructs feature matrices for training and inference from cleaned price time series.
    """

    FEATURE_COLS = [
        "source_average_price",
        "source_min_price",
        "source_max_price",
        "source_price_spread",
        "source_price_volatility",
        "source_count",
        # Lags
        "price_lag_1",
        "price_lag_2",
        "price_lag_3",
        "price_lag_7",
        "price_lag_14",
        "price_lag_21",
        "price_lag_30",
        # Rolling Statistics
        "rolling_mean_7",
        "rolling_mean_14",
        "rolling_mean_30",
        "rolling_std_7",
        "rolling_std_14",
        # Momentum & Changes
        "price_change_1d",
        "price_change_3d",
        "price_change_7d",
        "price_change_14d",
        # Supply / Arrival Dynamics
        "arrivals_lag_1",
        "arrivals_rolling_mean_7",
        "arrivals_change_7d",
        # Weather Observations
        "rainfall_lag_1",
        "rainfall_7d_sum",
        "temp_max_c",
        "temp_min_c",
        "temp_spread",
        "humidity_pct",
        # Calendar & Seasonality
        "day_of_week",
        "month",
        "day_of_year_sin",
        "day_of_year_cos",
    ]

    @classmethod
    def compute_consolidated_source_signal(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Consolidates multiple reporting price sources into aggregated signals
        while preserving source disagreement metrics.
        """
        price_cols = ["price_agmarknet", "price_enam", "price_local_mandi", "price_fpo_pool"]
        available_cols = [c for c in price_cols if c in df.columns]

        res = df.copy()
        if available_cols:
            res["source_average_price"] = res[available_cols].mean(axis=1)
            res["source_min_price"] = res[available_cols].min(axis=1)
            res["source_max_price"] = res[available_cols].max(axis=1)
            res["source_price_spread"] = res["source_max_price"] - res["source_min_price"]
            res["source_price_volatility"] = res[available_cols].std(axis=1).fillna(0.0)
            res["source_count"] = res[available_cols].count(axis=1)
        else:
            res["source_average_price"] = res.get("price", 2500.0)
            res["source_min_price"] = res["source_average_price"]
            res["source_max_price"] = res["source_average_price"]
            res["source_price_spread"] = 0.0
            res["source_price_volatility"] = 0.0
            res["source_count"] = 1

        return res

    @classmethod
    def build_features(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts all time-series features. Operates on a single crop-market time series ordered by date.
        """
        data = cls.compute_consolidated_source_signal(df).sort_values("date").reset_index(drop=True)
        price = data["source_average_price"]

        # Lags
        data["price_lag_1"] = price.shift(1)
        data["price_lag_2"] = price.shift(2)
        data["price_lag_3"] = price.shift(3)
        data["price_lag_7"] = price.shift(7)
        data["price_lag_14"] = price.shift(14)
        data["price_lag_21"] = price.shift(21)
        data["price_lag_30"] = price.shift(30)

        # Rolling statistics (using closed='left' equivalent via shift(1) to avoid data leakage)
        p_shifted = price.shift(1)
        data["rolling_mean_7"] = p_shifted.rolling(window=7, min_periods=3).mean()
        data["rolling_mean_14"] = p_shifted.rolling(window=14, min_periods=5).mean()
        data["rolling_mean_30"] = p_shifted.rolling(window=30, min_periods=10).mean()
        data["rolling_std_7"] = p_shifted.rolling(window=7, min_periods=3).std().fillna(0.0)
        data["rolling_std_14"] = p_shifted.rolling(window=14, min_periods=5).std().fillna(0.0)

        # Momentum / percentage differences
        data["price_change_1d"] = (price.shift(1) - price.shift(2)) / price.shift(2).replace(0, np.nan)
        data["price_change_3d"] = (price.shift(1) - price.shift(4)) / price.shift(4).replace(0, np.nan)
        data["price_change_7d"] = (price.shift(1) - price.shift(8)) / price.shift(8).replace(0, np.nan)
        data["price_change_14d"] = (price.shift(1) - price.shift(15)) / price.shift(15).replace(0, np.nan)

        # Arrivals dynamics
        arrivals = data.get("arrivals_quintals", pd.Series(500.0, index=data.index))
        arr_shifted = arrivals.shift(1)
        data["arrivals_lag_1"] = arr_shifted
        data["arrivals_rolling_mean_7"] = arr_shifted.rolling(window=7, min_periods=3).mean()
        data["arrivals_change_7d"] = (arr_shifted - arr_shifted.shift(7)) / arr_shifted.shift(7).replace(0, np.nan)

        # Weather dynamics
        rainfall = data.get("rainfall_mm", pd.Series(0.0, index=data.index))
        data["rainfall_lag_1"] = rainfall.shift(1)
        data["rainfall_7d_sum"] = rainfall.shift(1).rolling(window=7, min_periods=1).sum().fillna(0.0)
        data["temp_spread"] = data.get("temp_max_c", 32.0) - data.get("temp_min_c", 24.0)

        # Calendar features
        dates = pd.to_datetime(data["date"])
        data["day_of_week"] = dates.dt.weekday
        data["month"] = dates.dt.month
        day_of_year = dates.dt.dayofyear
        data["day_of_year_sin"] = np.sin(2 * np.pi * day_of_year / 365.25)
        data["day_of_year_cos"] = np.cos(2 * np.pi * day_of_year / 365.25)

        # Fill initial warmup NaNs using backfill
        data[cls.FEATURE_COLS] = data[cls.FEATURE_COLS].bfill().fillna(0.0)

        return data

    @classmethod
    def create_training_dataset(cls, df: pd.DataFrame, horizons: list[int] = list(range(1, 8))) -> tuple[pd.DataFrame, dict]:
        """
        Creates feature matrix X and target series y_h for horizons h=1..7.
        Ensures strictly causal targets y_h = price(t + h).
        """
        featured_df = cls.build_features(df)
        targets = {}

        for h in horizons:
            # Target for horizon h is price at step t + h
            targets[f"target_h{h}"] = featured_df["source_average_price"].shift(-h)

        target_df = pd.DataFrame(targets, index=featured_df.index)
        full_df = pd.concat([featured_df, target_df], axis=1)

        # Drop rows where longest horizon target is NaN (the last 7 days)
        max_h = max(horizons)
        valid_df = full_df.iloc[:-max_h].copy().reset_index(drop=True)

        return valid_df[cls.FEATURE_COLS], {f"h{h}": valid_df[f"target_h{h}"] for h in horizons}
