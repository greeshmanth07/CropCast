import { describe, expect, it } from "vitest";
import { getPriceForecast, getValidationMetrics } from "./forecast/service";

describe("7-Day Agricultural Price Forecasting Pipeline", () => {
  it("generates a 7-day crop price forecast with 8 history points and 7 forecast days", async () => {
    const res = await getPriceForecast("Tomato", "Visakhapatnam");

    expect(res).toBeDefined();
    expect(res.crop).toBe("Tomato");
    expect(res.current_price).toBeGreaterThan(0);
    expect(res.history.length).toBe(8); // 7 past days + today
    expect(res.forecast.length).toBe(7); // Day 1 to 7

    // Check forecast bounds
    res.forecast.forEach((f) => {
      expect(f.predicted_price).toBeGreaterThan(0);
      expect(f.lower_bound).toBeLessThanOrEqual(f.predicted_price);
      expect(f.upper_bound).toBeGreaterThanOrEqual(f.predicted_price);
      expect(f.confidence_score).toBeGreaterThan(0);
      expect(f.confidence_score).toBeLessThanOrEqual(1.0);
    });

    // Check summary
    expect(res.summary).toBeDefined();
    expect(["bullish", "bearish", "steady"]).toContain(res.summary.trend);
    expect(res.summary.best_selling_day).toBeTruthy();
    expect(res.summary.key_drivers.length).toBeGreaterThan(0);

    // Check model metadata
    expect(res.model.name).toContain("XGBoost");
    expect(res.model.version).toBe("1.0");
    expect(res.model.validation_mae).toBeGreaterThan(0);
  });

  it("retrieves walk-forward validation backtesting metrics", async () => {
    const metrics = await getValidationMetrics("Tomato", "Guntur");
    expect(metrics).toBeDefined();
    expect(metrics.validation_strategy).toContain("walk_forward");
    expect(metrics.overall_model_mae).toBeGreaterThan(0);
    expect(metrics.overall_baseline_mae).toBeGreaterThan(0);
    expect(Object.keys(metrics.metrics_by_horizon).length).toBe(7);
  });
});
