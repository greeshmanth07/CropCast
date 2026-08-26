"""
FastAPI Microservice for Agricultural Price Intelligence & Forecasting.
Exposes REST endpoints for 7-day crop price predictions, validation metrics, and model retraining.
"""
from pathlib import Path
import sys

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from ml.forecasting.predict import PriceForecaster
from ml.training.train import train_all_crop_models
from ml.training.validate import ModelValidator


app = FastAPI(
    title="CropCast ML Price Forecasting Service",
    description="7-Day Agricultural Price Intelligence Engine powered by XGBoost",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

forecaster = PriceForecaster()


class ForecastRequest(BaseModel):
    crop: str = Field(..., example="Tomato")
    market: str = Field(default="Guntur", example="Visakhapatnam")


@app.get("/health")
def health():
    return {"status": "ok", "service": "agrimarket-ml-forecasting", "model_loaded": True}


@app.post("/forecast")
def predict_forecast(req: ForecastRequest):
    try:
        result = forecaster.generate_7day_forecast(crop=req.crop, market=req.market)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@app.get("/metrics")
def get_validation_metrics(crop: str = "Tomato", market: str = "Guntur"):
    try:
        metrics_file = Path("ml/models/validation_metrics.json")
        if metrics_file.exists():
            import json
            with open(metrics_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data.get("crop", "").lower() == crop.lower() and data.get("market", "").lower() == market.lower():
                    return data

        metrics = ModelValidator.evaluate_walk_forward(crop=crop, market=market)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")


@app.post("/retrain")
def retrain_models():
    try:
        train_all_crop_models()
        # Reset cached models
        forecaster.models_cache.clear()
        forecaster.val_metrics = forecaster._load_validation_metrics()
        return {"status": "success", "message": "All XGBoost crop models retrained successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
