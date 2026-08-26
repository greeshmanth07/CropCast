import { describe, expect, it } from "vitest";
import { buildDemandForecast, buildRoutePlan } from "./matching";

describe("marketplace decision helpers", () => {
  it("marks available tomatoes as a high-demand opportunity", () => {
    const forecast = buildDemandForecast("Tomato", 1000);
    expect(forecast.demand).toBe("High");
    expect(forecast.predictedQuantityKg).toBe(1800);
    expect(forecast.trend).toBe("Rising");
  });

  it("plans a consolidated vehicle route for the SIH tomato flow", () => {
    const route = buildRoutePlan("Guntur FPO Collection Centre", "Vijayawada Central Kitchen", 1000);
    expect(route.consolidationCount).toBe(2);
    expect(route.vehicleCapacityKg).toBe(1500);
    expect(route.distanceKm).toBeGreaterThan(0);
  });
});
