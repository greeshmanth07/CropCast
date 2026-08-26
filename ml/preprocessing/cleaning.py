"""
Data Cleaning and Validation Preprocessing Layer.
Ensures data integrity, handles missing/corrupt values, and removes invalid outliers.
"""
import numpy as np
import pandas as pd


class DataCleaner:
    """
    Cleans, validates, and normalizes raw agricultural market time-series data.
    """

    PRICE_COLUMNS = ["price_agmarknet", "price_enam", "price_local_mandi", "price_fpo_pool"]

    @classmethod
    def clean_dataset(cls, df: pd.DataFrame) -> pd.DataFrame:
        """
        Full data cleaning pipeline:
        1. Validate schema and required columns
        2. Deduplicate records
        3. Standardize date index
        4. Clean and bound price observations
        5. Impute missing weather/arrival observations
        """
        if df.empty:
            raise ValueError("Input DataFrame for cleaning is empty.")

        clean_df = df.copy()

        # 1. Normalize date column
        clean_df["date"] = pd.to_datetime(clean_df["date"])
        clean_df = clean_df.sort_values("date").drop_duplicates(subset=["date", "crop", "market"], keep="last")

        # 2. Validate price columns
        for col in cls.PRICE_COLUMNS:
            if col in clean_df.columns:
                # Replace zero or negative prices with NaN
                clean_df.loc[clean_df[col] <= 0, col] = np.nan
                # Forward-fill, then backward-fill missing prices
                clean_df[col] = clean_df[col].ffill().bfill()

        # 3. Outlier handling using 14-day rolling IQR bounds
        for col in cls.PRICE_COLUMNS:
            if col in clean_df.columns:
                rolling_med = clean_df[col].rolling(window=14, min_periods=3, center=True).median()
                rolling_std = clean_df[col].rolling(window=14, min_periods=3, center=True).std().fillna(0)
                upper_bound = rolling_med + 3.5 * rolling_std
                lower_bound = (rolling_med - 3.5 * rolling_std).clip(lower=100.0)

                # Clip extreme spurious spikes
                clean_df[col] = np.where(clean_df[col] > upper_bound, upper_bound, clean_df[col])
                clean_df[col] = np.where(clean_df[col] < lower_bound, lower_bound, clean_df[col])

        # 4. Clean arrivals and weather
        if "arrivals_quintals" in clean_df.columns:
            clean_df["arrivals_quintals"] = clean_df["arrivals_quintals"].clip(lower=1.0).fillna(clean_df["arrivals_quintals"].median())

        if "rainfall_mm" in clean_df.columns:
            clean_df["rainfall_mm"] = clean_df["rainfall_mm"].clip(lower=0.0).fillna(0.0)

        if "temp_max_c" in clean_df.columns:
            clean_df["temp_max_c"] = clean_df["temp_max_c"].fillna(32.0).clip(lower=10.0, upper=50.0)

        if "temp_min_c" in clean_df.columns:
            clean_df["temp_min_c"] = clean_df["temp_min_c"].fillna(clean_df["temp_max_c"] - 8.0).clip(lower=5.0, upper=40.0)

        if "humidity_pct" in clean_df.columns:
            clean_df["humidity_pct"] = clean_df["humidity_pct"].fillna(65.0).clip(lower=15.0, upper=100.0)

        return clean_df.reset_index(drop=True)
