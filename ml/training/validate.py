"""
Chronological Walk-Forward Validation & Model Evaluation.
Strictly evaluates XGBoost regressors against a Naive Persistence Baseline
using rolling-origin walk-forward backtesting to eliminate temporal data leakage.
"""
import json
from pathlib import Path
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd
from xgboost import XGBRegressor
from ml.data.provider import get_default_provider
from ml.preprocessing.cleaning import DataCleaner
from ml.preprocessing.features import FeatureEngineer


class ModelValidator:
    """
    Performs out-of-time walk-forward evaluation across agricultural time series.
    """

    @classmethod
    def evaluate_walk_forward(
        cls,
        crop: str = "Tomato",
        market: str = "Guntur",
        min_train_size: int = 40,
        horizons: list[int] = list(range(1, 8)),
    ) -> dict:
        """
        Executes rolling walk-forward backtesting:
        At each evaluation cutoff t, trains on [0..t], predicts t+1..t+7,
        and computes MAE, RMSE, MAPE vs Naive Persistence baseline (Tomorrow = Today).
        """
        provider = get_default_provider()
        raw_df = provider.get_historical_market_data(crop, market, days=120)
        clean_df = DataCleaner.clean_dataset(raw_df)
        featured_df = FeatureEngineer.build_features(clean_df)

        n_samples = len(featured_df)
        max_h = max(horizons)
        if n_samples < min_train_size + max_h + 10:
            raise ValueError(f"Insufficient samples ({n_samples}) for walk-forward evaluation.")

        feature_cols = FeatureEngineer.FEATURE_COLS
        prices = featured_df["source_average_price"].values

        # Store predictions and actuals per horizon
        horizon_results = {h: {"actuals": [], "xgb_preds": [], "naive_preds": []} for h in horizons}

        for cutoff in range(min_train_size, n_samples - max_h):
            train_sub = featured_df.iloc[:cutoff]
            test_row = featured_df.iloc[cutoff : cutoff + 1][feature_cols]

            current_actual_price = prices[cutoff]

            for h in horizons:
                actual_future_price = prices[cutoff + h]

                # Train horizon h model on causal targets available up to cutoff
                # target is shift(-h)
                y_train = train_sub["source_average_price"].shift(-h).dropna()
                X_train = train_sub.iloc[: len(y_train)][feature_cols]

                if len(y_train) < 20:
                    continue

                model = XGBRegressor(
                    n_estimators=100,
                    max_depth=3,
                    learning_rate=0.06,
                    subsample=0.85,
                    colsample_bytree=0.85,
                    random_state=42,
                    n_jobs=-1,
                )
                model.fit(X_train, y_train)
                xgb_pred = float(model.predict(test_row)[0])

                horizon_results[h]["actuals"].append(actual_future_price)
                horizon_results[h]["xgb_preds"].append(xgb_pred)
                horizon_results[h]["naive_preds"].append(current_actual_price)

        # Compute summary metrics per horizon
        metrics_by_horizon = {}
        all_xgb_errors = []
        all_naive_errors = []
        residual_stds = {}

        for h in horizons:
            acts = np.array(horizon_results[h]["actuals"])
            xgb_p = np.array(horizon_results[h]["xgb_preds"])
            naive_p = np.array(horizon_results[h]["naive_preds"])

            if len(acts) == 0:
                continue

            xgb_err = xgb_p - acts
            naive_err = naive_p - acts
            all_xgb_errors.extend(np.abs(xgb_err))
            all_naive_errors.extend(np.abs(naive_err))

            xgb_mae = float(np.mean(np.abs(xgb_err)))
            xgb_rmse = float(np.sqrt(np.mean(xgb_err**2)))
            xgb_mape = float(np.mean(np.abs(xgb_err / acts)) * 100.0)

            naive_mae = float(np.mean(np.abs(naive_err)))
            naive_rmse = float(np.sqrt(np.mean(naive_err**2)))
            naive_mape = float(np.mean(np.abs(naive_err / acts)) * 100.0)

            # Directional accuracy: did price increase/decrease match?
            actual_dir = np.sign(acts - naive_p)
            pred_dir = np.sign(xgb_p - naive_p)
            dir_acc = float(np.mean(actual_dir == pred_dir) * 100.0)

            residual_stds[f"h{h}"] = float(np.std(xgb_err))

            metrics_by_horizon[f"Day_{h}"] = {
                "horizon_days": h,
                "evaluation_samples": len(acts),
                "xgb_mae": round(xgb_mae, 2),
                "xgb_rmse": round(xgb_rmse, 2),
                "xgb_mape_percent": round(xgb_mape, 2),
                "baseline_persistence_mae": round(naive_mae, 2),
                "baseline_persistence_rmse": round(naive_rmse, 2),
                "baseline_persistence_mape": round(naive_mape, 2),
                "mae_improvement_vs_baseline_pct": round(((naive_mae - xgb_mae) / naive_mae) * 100.0, 2) if naive_mae > 0 else 0.0,
                "directional_accuracy_pct": round(dir_acc, 2),
                "residual_std": round(residual_stds[f"h{h}"], 2),
            }

        overall_xgb_mae = float(np.mean(all_xgb_errors)) if all_xgb_errors else 0.0
        overall_naive_mae = float(np.mean(all_naive_errors)) if all_naive_errors else 0.0

        report = {
            "crop": crop,
            "market": market,
            "validation_strategy": "chronological_walk_forward_backtest",
            "overall_model_mae": round(overall_xgb_mae, 2),
            "overall_baseline_mae": round(overall_naive_mae, 2),
            "overall_mae_improvement_pct": round(((overall_naive_mae - overall_xgb_mae) / overall_naive_mae) * 100.0, 2) if overall_naive_mae > 0 else 0.0,
            "metrics_by_horizon": metrics_by_horizon,
            "residual_stds": residual_stds,
        }

        return report


if __name__ == "__main__":
    print("Running Walk-Forward Model Validation...")
    results = ModelValidator.evaluate_walk_forward("Tomato", "Guntur")
    output_path = Path("ml/models/validation_metrics.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print(f"Validation complete! Overall XGBoost MAE: Rs. {results['overall_model_mae']}/q vs Baseline: Rs. {results['overall_baseline_mae']}/q")
    print(f"Report saved to {output_path}")
