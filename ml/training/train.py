"""
Model Training Pipeline for Agricultural Price Forecasting.
Trains 7 horizon-specific XGBoost regressors across supported crops and mandis.
Saves serialized JSON models and feature metadata to ml/models/.
"""
import json
from pathlib import Path
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from xgboost import XGBRegressor
from ml.data.provider import get_default_provider
from ml.preprocessing.cleaning import DataCleaner
from ml.preprocessing.features import FeatureEngineer
from ml.training.validate import ModelValidator


MODEL_DIR = Path("ml/models")


def train_all_crop_models():
    """
    Executes training pipeline:
    1. Ingests and cleans 120-day historical time-series data
    2. Builds non-leaking feature matrices
    3. Fits XGBoost models for horizons h=1..7
    4. Serializes models and evaluates walk-forward performance
    """
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    provider = get_default_provider()
    supported = provider.get_all_supported_crops_and_markets()

    model_registry = {
        "version": "1.0.0",
        "algorithm": "XGBoost Regressor (7-Horizon Direct Multi-Output)",
        "features": FeatureEngineer.FEATURE_COLS,
        "models": {},
    }

    print("=" * 60)
    print("STARTING XGBOOST PRICE FORECASTING MODEL TRAINING")
    print("=" * 60)

    for crop, markets in supported.items():
        primary_market = markets[0]
        print(f"\nTraining models for crop: {crop} (Primary Mandi: {primary_market})...")

        raw_df = provider.get_historical_market_data(crop, primary_market, days=120)
        clean_df = DataCleaner.clean_dataset(raw_df)
        X, targets = FeatureEngineer.create_training_dataset(clean_df)

        crop_entry = {"crop": crop, "primary_market": primary_market, "horizons": {}}

        for h in range(1, 8):
            y = targets[f"h{h}"]
            model = XGBRegressor(
                n_estimators=140,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.85,
                colsample_bytree=0.85,
                gamma=0.1,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                n_jobs=-1,
            )
            model.fit(X, y)

            model_filename = f"xgb_{crop.lower()}_h{h}.json"
            model_path = MODEL_DIR / model_filename
            model.save_model(str(model_path))

            crop_entry["horizons"][f"h{h}"] = {
                "file": model_filename,
                "feature_count": len(FeatureEngineer.FEATURE_COLS),
                "samples_trained": len(X),
            }

        model_registry["models"][crop] = crop_entry

    # Execute and persist walk-forward validation for Tomato and other key crops
    print("\nRunning Walk-Forward Backtesting Validation...")
    val_report = ModelValidator.evaluate_walk_forward("Tomato", "Guntur")
    with open(MODEL_DIR / "validation_metrics.json", "w", encoding="utf-8") as f:
        json.dump(val_report, f, indent=2)

    # Save registry
    with open(MODEL_DIR / "model_registry.json", "w", encoding="utf-8") as f:
        json.dump(model_registry, f, indent=2)

    print("\n" + "=" * 60)
    print("ALL MODELS SUCCESSFULLY TRAINED AND SAVED TO ml/models/")
    print(f"Overall Backtested Model MAE: Rs. {val_report['overall_model_mae']}/q (vs Baseline Rs. {val_report['overall_baseline_mae']}/q)")
    print("=" * 60)


if __name__ == "__main__":
    train_all_crop_models()
