# AgriMarket ML Price-Forecasting Engine (XGBoost)

Production-grade 7-day agricultural price-forecasting microservice for the SIH 2026 AgriMarket platform.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React Frontend                       │
│  (15-Point Recharts: 7 Past + Today + 7 Forecast Days) │
└──────────────────────────▲─────────────────────────────┘
                           │ (tRPC & POST /api/forecast)
┌──────────────────────────▼─────────────────────────────┐
│             Node.js / Express Backend                  │
│       (Express Route + tRPC Router + Service)          │
└──────────────────────────▲─────────────────────────────┘
                           │ (HTTP JSON API on Port 8000)
┌──────────────────────────▼─────────────────────────────┐
│             Python FastAPI ML Service                  │
│   (XGBoost 7-Horizon Regressors + Prediction Bounds)   │
└──────────────────────────▲─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│  Data Ingestion -> Cleaning -> Feature Engineering     │
│  (Multi-Source Aggregations, Lags, Weather, Arrivals)  │
└────────────────────────────────────────────────────────┘
```

---

## 2. ML Pipeline Components

### A. Data Ingestion & Provider Layer (`ml/data/provider.py`)
- **Abstract Interface**: `BaseDataProvider` ensures live government APIs (e-NAM, Agmarknet, Open-Meteo) can replace the sample layer without modifying the model or APIs.
- **Sample Data Layer**: Explicitly labelled as `sample_demonstration_data`. Generates 120-day time series per crop & mandi with:
  - Multi-source reporting prices (`price_agmarknet`, `price_enam`, `price_local_mandi`, `price_fpo_pool`)
  - Mandi arrivals in quintals (`arrivals_quintals`)
  - Weather observations (`rainfall_mm`, `temp_max_c`, `temp_min_c`, `humidity_pct`)

### B. Preprocessing & Cleaning (`ml/preprocessing/cleaning.py`)
- Date deduplication and chronological ordering
- Outlier filtering using 14-day rolling IQR bounds
- Missing weather / arrival imputation with forward/backward fill and median clips
- Unit standardization to ₹/quintal

### C. Feature Engineering (`ml/preprocessing/features.py`)
Strictly causal time-series features constructed without future data leakage:
1. **Multi-Source Aggregation**: `source_average_price`, `source_min_price`, `source_max_price`, `source_price_spread`, `source_price_volatility`, `source_count`
2. **Lags**: `price_lag_1`, `price_lag_2`, `price_lag_3`, `price_lag_7`, `price_lag_14`, `price_lag_21`, `price_lag_30`
3. **Rolling Statistics**: 7-day, 14-day, 30-day rolling means and standard deviations
4. **Momentum**: 1-day, 3-day, 7-day, 14-day percentage changes
5. **Supply Dynamics**: `arrivals_lag_1`, `arrivals_rolling_mean_7`, `arrivals_change_7d`
6. **Weather Observations**: `rainfall_lag_1`, `rainfall_7d_sum`, `temp_max_c`, `temp_min_c`, `temp_spread`, `humidity_pct`
7. **Calendar & Seasonality**: `day_of_week`, `month`, `day_of_year_sin`, `day_of_year_cos`

### D. Model Architecture (`ml/training/train.py`)
- **Algorithm**: 7 horizon-specific XGBoost regressors ($h \in [1..7]$).
- **Hyperparameters**: `n_estimators=140`, `max_depth=4`, `learning_rate=0.05`, `subsample=0.85`, `colsample_bytree=0.85`.
- **Confidence Intervals**: 90% prediction intervals calculated using out-of-fold empirical residual standard deviations:
  $$\text{Interval}_h = [\hat{y}_h - 1.645 \cdot \sigma_h, \; \hat{y}_h + 1.645 \cdot \sigma_h]$$

### E. Chronological Walk-Forward Validation (`ml/training/validate.py`)
- **Strategy**: Rolling walk-forward backtesting (expanding training window) across historical test points.
- **Baseline**: Compares XGBoost against Naive Persistence Baseline ($y_{t+h} = y_t$).
- **Metrics**: MAE, RMSE, MAPE %, and Directional Accuracy % stored in `ml/models/validation_metrics.json`.

---

## 3. API Specification

### `POST /api/forecast` (Node.js) or `POST /forecast` (FastAPI)
**Request Body**:
```json
{
  "crop": "Tomato",
  "market": "Visakhapatnam"
}
```

**Response Format**:
```json
{
  "crop": "Tomato",
  "market": "Visakhapatnam",
  "current_price": 2807.4,
  "history": [
    { "date": "2026-08-19", "day_name": "Wednesday", "price": 2941.78, "is_today": false },
    ...
    { "date": "2026-08-26", "day_name": "Wednesday", "price": 2807.4, "is_today": true }
  ],
  "forecast": [
    {
      "date": "2026-08-27",
      "day_name": "Thursday",
      "day": 1,
      "predicted_price": 2669.81,
      "lower_bound": 2342.31,
      "upper_bound": 2997.31,
      "confidence_score": 0.92
    }
  ],
  "summary": {
    "seven_day_change_percent": -17.81,
    "seven_day_price_difference": -499.89,
    "trend": "bearish",
    "best_selling_day": "Thursday",
    "best_selling_date": "2026-08-27",
    "best_selling_price": 2669.81,
    "potential_gain_per_quintal": 0,
    "key_drivers": [
      "Steady supply inflows across neighboring AP mandis",
      "Strong regional retail and processor procurement demand",
      "Weather patterns indicating stable transit conditions"
    ]
  },
  "model": {
    "name": "XGBoost Multi-Horizon Regressor",
    "version": "1.0",
    "validation_mae": 38.5,
    "baseline_persistence_mae": 52.0,
    "mae_improvement_percent": 25.96
  }
}
```

---

## 4. Commands to Run & Train

### 1. Train / Retrain Models
```powershell
ml/.venv/Scripts/python.exe ml/training/train.py
```

### 2. Run Walk-Forward Validation
```powershell
ml/.venv/Scripts/python.exe ml/training/validate.py
```

### 3. Start Python FastAPI ML Microservice
```powershell
ml/.venv/Scripts/python.exe -m uvicorn ml.main:app --host 127.0.0.1 --port 8000
```

### 4. Start Node.js Application Server
```powershell
node --import tsx server/index.ts
```

### 5. Run Automated Tests
```powershell
npx.cmd vitest run
```
