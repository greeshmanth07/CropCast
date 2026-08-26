export interface HistoryPoint {
  date: string;
  day_name: string;
  price: number;
  is_today: boolean;
}

export interface ForecastPoint {
  date: string;
  day_name: string;
  day: number;
  predicted_price: number;
  lower_bound: number;
  upper_bound: number;
  confidence_score: number;
}

export interface ForecastSummary {
  seven_day_change_percent: number;
  seven_day_price_difference: number;
  direction: "rising" | "falling" | "stable";
  trend: "bullish" | "bearish" | "steady";
  seven_day_high: number;
  seven_day_low: number;
  best_selling_day: string;
  best_selling_date: string;
  best_selling_price: number;
  best_buying_day: string;
  best_buying_date: string;
  best_buying_price: number;
  momentum_percent: number;
  volatility: "Low" | "Medium" | "High";
  farmer_signal: "HOLD" | "SELL" | "MONITOR";
  farmer_signal_description: string;
  buyer_signal: "BUY NOW" | "WAIT / HOLD" | "BUY ON DEMAND";
  buyer_signal_description: string;
  potential_gain_per_quintal: number;
  potential_savings_per_quintal: number;
  key_drivers: string[];
}

export interface MarketComparisonItem {
  market: string;
  current_price: number;
  expected_7d_change_percent: number;
  direction: "rising" | "falling" | "stable";
  is_current: boolean;
}

export interface DataSourceItem {
  name: string;
  status: string;
  weight: string;
}

export interface ExplanationInfo {
  summary: string;
  factors: string[];
}

export interface ModelMetadata {
  name: string;
  version: string;
  validation_mae: number;
  validation_rmse: number;
  baseline_persistence_mae: number;
  mae_improvement_percent: number;
  evaluation_status: string;
}

export interface ForecastResponse {
  crop: string;
  market: string;
  current_price: number;
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  summary: ForecastSummary;
  explanation: ExplanationInfo;
  market_comparisons: MarketComparisonItem[];
  sources: DataSourceItem[];
  model: ModelMetadata;
  timestamps: {
    prices_updated: string;
    forecast_generated: string;
  };
  generated_at: string;
}

export interface ValidationMetricsResponse {
  crop: string;
  market: string;
  validation_strategy: string;
  overall_model_mae: number;
  overall_baseline_mae: number;
  overall_mae_improvement_pct: number;
  metrics_by_horizon: Record<string, {
    horizon_days: number;
    evaluation_samples: number;
    xgb_mae: number;
    xgb_rmse: number;
    xgb_mape_percent: number;
    baseline_persistence_mae: number;
    baseline_persistence_rmse: number;
    baseline_persistence_mape: number;
    mae_improvement_vs_baseline_pct: number;
    directional_accuracy_pct: number;
    residual_std: number;
  }>;
  residual_stds: Record<string, number>;
}
