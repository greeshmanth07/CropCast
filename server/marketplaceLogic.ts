export type DemandForecast = {
  demand: "High" | "Medium" | "Low";
  predictedQuantityKg: number;
  sellingPeriod: string;
  trend: "Rising" | "Steady" | "Cooling";
  recommendedPricePerKg: number;
  explanation: string;
};

const forecastProfiles: Record<string, Omit<DemandForecast, "predictedQuantityKg">> = {
  tomato: { demand: "High", sellingPeriod: "Next 3–5 days", trend: "Rising", recommendedPricePerKg: 34, explanation: "Hotel and retail demand is stronger while nearby arrivals remain lower." },
  chilli: { demand: "Medium", sellingPeriod: "Next 5–7 days", trend: "Steady", recommendedPricePerKg: 118, explanation: "Processor demand is stable and supply is balanced." },
  onion: { demand: "Medium", sellingPeriod: "Next 4–6 days", trend: "Rising", recommendedPricePerKg: 28, explanation: "Retail replenishment is expected to improve demand." },
};

export function buildDemandForecast(crop: string, availableKg: number): DemandForecast {
  const profile = forecastProfiles[crop.toLowerCase()] ?? {
    demand: "Low" as const,
    sellingPeriod: "Plan over the next week",
    trend: "Steady" as const,
    recommendedPricePerKg: 30,
    explanation: "Current demand is balanced against available supply.",
  };
  return { ...profile, predictedQuantityKg: Math.max(300, Math.round(availableKg * (profile.demand === "High" ? 1.8 : profile.demand === "Medium" ? 1.2 : 0.75))) };
}

export function buildRoutePlan(pickupLocation: string, deliveryLocation: string, quantityKg: number) {
  const consolidationCount = quantityKg >= 900 ? 2 : 1;
  const distanceKm = consolidationCount === 2 ? 48 : 34;
  const etaMinutes = consolidationCount === 2 ? 118 : 82;
  const vehicleCapacityKg = quantityKg > 750 ? 1500 : 750;
  return {
    routeName: `Optimized collection: ${pickupLocation} → ${deliveryLocation}`,
    pickupPoints: consolidationCount === 2 ? `${pickupLocation}|Pedakakani collection point` : pickupLocation,
    deliveryLocation,
    distanceKm,
    etaMinutes,
    vehicleCapacityKg,
    consolidationCount,
  };
}
