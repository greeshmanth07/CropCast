import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getFarmerProfileByMobile: vi.fn(),
  upsertFarmerProfile: vi.fn(),
  getMarketplaceSnapshot: vi.fn(),
  seedTomatoDemo: vi.fn(),
  createProduceListing: vi.fn(),
  createBuyerRequirement: vi.fn(),
  findMatchingListings: vi.fn(),
  placeMarketplaceOrder: vi.fn(),
  updateOrderStatus: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const listing = { id: 41, farmerMobile: "9876543210", sellerName: "Lakshmi FPO", crop: "Tomato", quantityKg: 1000, availableKg: 1000, quality: "A Grade", location: "Guntur FPO Collection Centre", harvestDate: "Fresh harvest · tomorrow", pricePerKg: 31, status: "available" };
const requirement = { id: 52, buyerName: "Grand Kitchens Hotels", buyerType: "Hotel group", crop: "Tomato", quantityKg: 1000, quality: "A Grade", location: "Vijayawada Central Kitchen", requiredDate: "Required in 2 days", maxPricePerKg: 34, status: "open" };
const route = { id: 71, orderId: 61, routeName: "Optimized collection", pickupPoints: "Guntur|Pedakakani", deliveryLocation: "Vijayawada", distanceKm: 48, etaMinutes: 118, vehicleCapacityKg: 1500, consolidationCount: 2, status: "planned" };

function caller() {
  return appRouter.createCaller({ user: null, req: {} as any, res: {} as any });
}

describe("marketplace procedures", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    dbMocks.getMarketplaceSnapshot.mockResolvedValue({ listings: [listing], requirements: [requirement], orders: [], routes: [], forecast: { demand: "High", predictedQuantityKg: 1800, sellingPeriod: "Next 3–5 days", trend: "Rising", recommendedPricePerKg: 34, explanation: "High hotel demand" } });
    dbMocks.seedTomatoDemo.mockResolvedValue({ listing, requirement, forecast: { demand: "High" } });
    dbMocks.createProduceListing.mockResolvedValue(listing);
    dbMocks.createBuyerRequirement.mockResolvedValue(requirement);
    dbMocks.findMatchingListings.mockResolvedValue([{ ...listing, qualityMatch: true, quantityCoverage: 100, distanceNote: "48 km optimized route" }]);
    dbMocks.placeMarketplaceOrder.mockResolvedValue({ order: { id: 61, status: "confirmed" }, route });
    dbMocks.updateOrderStatus.mockResolvedValue({ id: 61, status: "delivered" });
  });

  it("creates a transparent FPO listing and posts a buyer requirement", async () => {
    const api = caller();
    const createdListing = await api.marketplace.createListing({ farmerMobile: "9876543210", sellerName: "Lakshmi FPO", crop: "Tomato", quantityKg: 1000, quality: "A Grade", location: "Guntur FPO Collection Centre", harvestDate: "Fresh harvest · tomorrow", pricePerKg: 31 });
    const createdRequirement = await api.marketplace.createRequirement({ buyerName: "Grand Kitchens Hotels", buyerType: "Hotel group", crop: "Tomato", quantityKg: 1000, quality: "A Grade", location: "Vijayawada Central Kitchen", requiredDate: "Required in 2 days", maxPricePerKg: 34 });
    expect(createdListing).toMatchObject({ id: 41, quantityKg: 1000, pricePerKg: 31 });
    expect(createdRequirement).toMatchObject({ id: 52, buyerName: "Grand Kitchens Hotels" });
    expect(dbMocks.createProduceListing).toHaveBeenCalledOnce();
    expect(dbMocks.createBuyerRequirement).toHaveBeenCalledOnce();
  });

  it("finds supplier matches, creates a direct order, route, and delivery status", async () => {
    const api = caller();
    const matches = await api.marketplace.matches({ requirementId: 52 });
    const result = await api.marketplace.placeOrder({ listingId: 41, requirementId: 52, buyerName: "Grand Kitchens Hotels", quantityKg: 1000 });
    const delivered = await api.marketplace.updateOrderStatus({ orderId: 61, status: "delivered" });
    expect(matches[0]).toMatchObject({ sellerName: "Lakshmi FPO", quantityCoverage: 100 });
    expect(result.route).toMatchObject({ distanceKm: 48, vehicleCapacityKg: 1500 });
    expect(delivered).toMatchObject({ status: "delivered" });
    expect(dbMocks.findMatchingListings).toHaveBeenCalledWith(52);
    expect(dbMocks.placeMarketplaceOrder).toHaveBeenCalledWith({ listingId: 41, requirementId: 52, buyerName: "Grand Kitchens Hotels", quantityKg: 1000 });
    expect(dbMocks.updateOrderStatus).toHaveBeenCalledWith(61, "delivered");
  });

  it("returns the ready-to-run tomato demo snapshot", async () => {
    const result = await caller().marketplace.seedTomatoDemo();
    expect(result).toMatchObject({ listing: { quantityKg: 1000 }, requirement: { crop: "Tomato" }, forecast: { demand: "High" } });
    expect(dbMocks.seedTomatoDemo).toHaveBeenCalledOnce();
  });
});
