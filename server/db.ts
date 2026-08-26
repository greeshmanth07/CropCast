import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  buyerRequirements,
  FarmerProfile,
  farmerProfiles,
  InsertFarmerProfile,
  InsertUser,
  logisticsRoutes,
  marketplaceOrders,
  produceListings,
  users,
} from "../drizzle/schema";
import { buildDemandForecast, buildRoutePlan } from "./matching";

const { Pool } = pg;

let _pool: pg.Pool | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to initialize Postgres connection:", error);
      _db = null;
    }
  }
  return _db;
}

// --------------------------------------------------------------------------
// IN-MEMORY & FALLBACK SEED DATA (For seamless presentations to professors)
// --------------------------------------------------------------------------
export interface AppUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  mobile: string;
  role: "farmer" | "buyer" | "admin" | "user";
  location: string;
  language?: string;
  recentCrops?: string[];
  watchlist?: string[];
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

const memoryUsers: Map<string, AppUser> = new Map();
const memorySessions: Map<string, { userId: number; expiresAt: Date }> = new Map();

const memoryFarmerProfiles: Map<
  string,
  {
    id: number;
    mobile: string;
    fullName: string;
    location: string;
    language: string;
    accountRole: string;
    recentCrops: string;
    watchlist: string;
    createdAt: Date;
    updatedAt: Date;
  }
> = new Map([
  [
    "9876543210",
    {
      id: 1,
      mobile: "9876543210",
      fullName: "Ravi Kumar",
      location: "Tenali, Guntur, AP",
      language: "English",
      accountRole: "farmer",
      recentCrops: JSON.stringify(["Tomato", "Chilli", "Rice"]),
      watchlist: JSON.stringify(["tomato", "chilli"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "9000000000",
    {
      id: 2,
      mobile: "9000000000",
      fullName: "Lakshmi FPO",
      location: "Guntur FPO Hub, Andhra Pradesh",
      language: "Telugu",
      accountRole: "farmer",
      recentCrops: JSON.stringify(["Tomato", "Cotton", "Maize"]),
      watchlist: JSON.stringify(["tomato", "cotton"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  [
    "9123456789",
    {
      id: 3,
      mobile: "9123456789",
      fullName: "Sri Krishna Supermarket",
      location: "Vijayawada, Andhra Pradesh",
      language: "English",
      accountRole: "buyer",
      recentCrops: JSON.stringify(["Tomato", "Onion", "Potato"]),
      watchlist: JSON.stringify(["tomato", "onion"]),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
]);

let nextUserId = 10;
let nextListingId = 10;
let nextRequirementId = 10;
let nextOrderId = 10;
let nextRouteId = 10;

const memoryListings: any[] = [
  {
    id: 1,
    farmerMobile: "9000000000",
    sellerName: "Lakshmi FPO",
    crop: "Tomato",
    quantityKg: 1000,
    availableKg: 1000,
    quality: "A Grade",
    location: "Guntur FPO Collection Centre, Andhra Pradesh",
    harvestDate: "Fresh harvest · tomorrow",
    pricePerKg: 31,
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    farmerMobile: "9876543210",
    sellerName: "Ravi Kumar",
    crop: "Chilli",
    quantityKg: 500,
    availableKg: 500,
    quality: "A Grade",
    location: "Tenali Market Yard, Andhra Pradesh",
    harvestDate: "Ready now",
    pricePerKg: 115,
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    farmerMobile: "9876543210",
    sellerName: "Ravi Kumar",
    crop: "Rice",
    quantityKg: 2000,
    availableKg: 2000,
    quality: "A Grade",
    location: "Guntur Rural, Andhra Pradesh",
    harvestDate: "Ready in 3 days",
    pricePerKg: 24,
    status: "available",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const memoryRequirements: any[] = [
  {
    id: 1,
    buyerName: "Grand Kitchens Hotels",
    buyerType: "Hotel group",
    crop: "Tomato",
    quantityKg: 1000,
    quality: "A Grade",
    location: "Vijayawada Central Kitchen, Andhra Pradesh",
    requiredDate: "Required in 2 days",
    maxPricePerKg: 34,
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    buyerName: "Sri Krishna Supermarket",
    buyerType: "Retail chain",
    crop: "Onion",
    quantityKg: 800,
    quality: "A Grade",
    location: "Guntur Town, Andhra Pradesh",
    requiredDate: "Required tomorrow",
    maxPricePerKg: 26,
    status: "open",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const memoryOrders: any[] = [];
const memoryRoutes: any[] = [];

// --------------------------------------------------------------------------
// AUTHENTICATION: PASSWORDLESS (Name + Mobile + Location)
// --------------------------------------------------------------------------
export async function registerOrLoginPasswordless(input: {
  fullName: string;
  mobile: string;
  location: string;
  language?: string;
  role?: "farmer" | "buyer" | "admin";
}): Promise<{ user: AppUser; profile: any; sessionId: string }> {
  const normalizedMobile = input.mobile.replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(normalizedMobile)) {
    throw new Error("Please enter a valid 10-digit Indian mobile number.");
  }

  const name = input.fullName.trim() || "Farmer";
  const location = input.location.trim() || "Guntur, Andhra Pradesh";
  const language = input.language || "English";
  const role = input.role || "farmer";
  const now = new Date();

  // Try PostgreSQL Database first
  const db = await getDb();
  let dbRecord: any = null;

  if (db) {
    try {
      const existing = await db
        .select()
        .from(farmerProfiles)
        .where(eq(farmerProfiles.mobile, normalizedMobile))
        .limit(1);

      if (existing.length > 0) {
        // Update location and name if provided
        await db
          .update(farmerProfiles)
          .set({
            fullName: name,
            location: location,
            language: language,
            accountRole: role,
            updatedAt: now,
          })
          .where(eq(farmerProfiles.mobile, normalizedMobile));

        dbRecord = {
          ...existing[0],
          fullName: name,
          location: location,
          language: language,
          accountRole: role,
        };
      } else {
        const inserted = await db
          .insert(farmerProfiles)
          .values({
            mobile: normalizedMobile,
            fullName: name,
            location: location,
            language: language,
            accountRole: role,
            recentCrops: JSON.stringify(["Tomato", "Chilli"]),
            watchlist: JSON.stringify(["tomato"]),
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        dbRecord = inserted[0];
      }
    } catch (err) {
      console.warn("[Database] Postgres save error, falling back to memory:", err);
    }
  }

  // Update in-memory fallback
  const memoryRecord = {
    id: dbRecord?.id || nextUserId++,
    mobile: normalizedMobile,
    fullName: name,
    location: location,
    language: language,
    accountRole: role,
    recentCrops: dbRecord?.recentCrops || JSON.stringify(["Tomato", "Chilli"]),
    watchlist: dbRecord?.watchlist || JSON.stringify(["tomato"]),
    createdAt: now,
    updatedAt: now,
  };
  memoryFarmerProfiles.set(normalizedMobile, memoryRecord);

  const userObj: AppUser = {
    id: memoryRecord.id,
    openId: `mobile_${normalizedMobile}`,
    name: memoryRecord.fullName,
    email: `${normalizedMobile}@cropcast.in`,
    mobile: normalizedMobile,
    role: role,
    location: location,
    language: language,
    recentCrops: JSON.parse(memoryRecord.recentCrops || "[]"),
    watchlist: JSON.parse(memoryRecord.watchlist || "[]"),
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };

  memoryUsers.set(normalizedMobile, userObj);

  const sessionId = crypto.randomUUID();
  memorySessions.set(sessionId, {
    userId: userObj.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { user: userObj, profile: memoryRecord, sessionId };
}

export async function lookupFarmerByMobile(mobile: string) {
  const normalized = mobile.replace(/\D/g, "").slice(-10);
  if (!/^\d{10}$/.test(normalized)) return null;

  const db = await getDb();
  if (db) {
    try {
      const records = await db
        .select()
        .from(farmerProfiles)
        .where(eq(farmerProfiles.mobile, normalized))
        .limit(1);
      if (records.length > 0) {
        return records[0];
      }
    } catch (err) {
      console.warn("[Database] lookupFarmerByMobile fallback:", err);
    }
  }

  return memoryFarmerProfiles.get(normalized) || null;
}

export async function upsertFarmerProfile(profile: {
  mobile: string;
  fullName: string;
  location: string;
  language?: string;
  accountRole?: string;
  recentCrops?: string[];
  watchlist?: string[];
}) {
  const normalized = profile.mobile.replace(/\D/g, "").slice(-10);
  const now = new Date();
  const db = await getDb();

  const recentCropsStr = profile.recentCrops ? JSON.stringify(profile.recentCrops) : undefined;
  const watchlistStr = profile.watchlist ? JSON.stringify(profile.watchlist) : undefined;

  if (db) {
    try {
      const existing = await db
        .select()
        .from(farmerProfiles)
        .where(eq(farmerProfiles.mobile, normalized))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(farmerProfiles)
          .set({
            fullName: profile.fullName,
            location: profile.location,
            language: profile.language || existing[0].language,
            accountRole: profile.accountRole || existing[0].accountRole,
            recentCrops: recentCropsStr || existing[0].recentCrops,
            watchlist: watchlistStr || existing[0].watchlist,
            updatedAt: now,
          })
          .where(eq(farmerProfiles.mobile, normalized));
      } else {
        await db.insert(farmerProfiles).values({
          mobile: normalized,
          fullName: profile.fullName,
          location: profile.location,
          language: profile.language || "English",
          accountRole: profile.accountRole || "farmer",
          recentCrops: recentCropsStr || JSON.stringify(["Tomato"]),
          watchlist: watchlistStr || JSON.stringify(["tomato"]),
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (err) {
      console.warn("[Database] upsertFarmerProfile DB fallback:", err);
    }
  }

  const current = memoryFarmerProfiles.get(normalized);
  const updated = {
    id: current?.id || nextUserId++,
    mobile: normalized,
    fullName: profile.fullName,
    location: profile.location,
    language: profile.language || current?.language || "English",
    accountRole: profile.accountRole || current?.accountRole || "farmer",
    recentCrops: recentCropsStr || current?.recentCrops || JSON.stringify(["Tomato"]),
    watchlist: watchlistStr || current?.watchlist || JSON.stringify(["tomato"]),
    createdAt: current?.createdAt || now,
    updatedAt: now,
  };
  memoryFarmerProfiles.set(normalized, updated);
  return updated;
}

// --------------------------------------------------------------------------
// MARKETPLACE PRODUCE LISTINGS & REQUIREMENTS
// --------------------------------------------------------------------------
export async function getMarketplaceListings() {
  const db = await getDb();
  if (db) {
    try {
      const records = await db.select().from(produceListings);
      if (records.length > 0) return records;
    } catch (err) {
      console.warn("[Database] getMarketplaceListings fallback:", err);
    }
  }
  return memoryListings;
}

export async function addProduceListing(listing: {
  farmerMobile: string;
  sellerName: string;
  crop: string;
  quantityKg: number;
  quality: string;
  location: string;
  harvestDate: string;
  pricePerKg: number;
}) {
  const now = new Date();
  const db = await getDb();

  if (db) {
    try {
      const inserted = await db
        .insert(produceListings)
        .values({
          farmerMobile: listing.farmerMobile,
          sellerName: listing.sellerName,
          crop: listing.crop,
          quantityKg: listing.quantityKg,
          availableKg: listing.quantityKg,
          quality: listing.quality,
          location: listing.location,
          harvestDate: listing.harvestDate,
          pricePerKg: listing.pricePerKg,
          status: "available",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted.length > 0) {
        memoryListings.unshift(inserted[0]);
        return inserted[0];
      }
    } catch (err) {
      console.warn("[Database] addProduceListing fallback:", err);
    }
  }

  const memoryItem = {
    id: nextListingId++,
    ...listing,
    availableKg: listing.quantityKg,
    status: "available",
    createdAt: now,
    updatedAt: now,
  };
  memoryListings.unshift(memoryItem);
  return memoryItem;
}

export async function getMarketplaceRequirements() {
  const db = await getDb();
  if (db) {
    try {
      const records = await db.select().from(buyerRequirements);
      if (records.length > 0) return records;
    } catch (err) {
      console.warn("[Database] getMarketplaceRequirements fallback:", err);
    }
  }
  return memoryRequirements;
}

export async function addBuyerRequirement(req: {
  buyerName: string;
  buyerType: string;
  crop: string;
  quantityKg: number;
  quality: string;
  location: string;
  requiredDate: string;
  maxPricePerKg: number;
}) {
  const now = new Date();
  const db = await getDb();

  if (db) {
    try {
      const inserted = await db
        .insert(buyerRequirements)
        .values({
          ...req,
          status: "open",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted.length > 0) {
        memoryRequirements.unshift(inserted[0]);
        return inserted[0];
      }
    } catch (err) {
      console.warn("[Database] addBuyerRequirement fallback:", err);
    }
  }

  const memoryItem = {
    id: nextRequirementId++,
    ...req,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  memoryRequirements.unshift(memoryItem);
  return memoryItem;
}

export async function createDirectOrder(order: {
  listingId: number;
  requirementId?: number;
  buyerName: string;
  quantityKg: number;
  pricePerKg: number;
  totalAmount: number;
}) {
  const now = new Date();
  const db = await getDb();

  if (db) {
    try {
      const inserted = await db
        .insert(marketplaceOrders)
        .values({
          ...order,
          status: "confirmed",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted.length > 0) {
        memoryOrders.unshift(inserted[0]);
        return inserted[0];
      }
    } catch (err) {
      console.warn("[Database] createDirectOrder fallback:", err);
    }
  }

  const memoryItem = {
    id: nextOrderId++,
    ...order,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  };
  memoryOrders.unshift(memoryItem);
  return memoryItem;
}

export async function getMarketplaceOrders() {
  const db = await getDb();
  if (db) {
    try {
      const records = await db.select().from(marketplaceOrders);
      if (records.length > 0) return records;
    } catch (err) {
      console.warn("[Database] getMarketplaceOrders fallback:", err);
    }
  }
  return memoryOrders;
}

export async function getLogisticsRoutes() {
  const db = await getDb();
  if (db) {
    try {
      const records = await db.select().from(logisticsRoutes);
      if (records.length > 0) return records;
    } catch (err) {
      console.warn("[Database] getLogisticsRoutes fallback:", err);
    }
  }
  return memoryRoutes;
}

export async function createLogisticsRoute(route: {
  orderId: number;
  routeName: string;
  pickupPoints: string;
  deliveryLocation: string;
  distanceKm: number;
  etaMinutes: number;
  vehicleCapacityKg: number;
  consolidationCount?: number;
}) {
  const now = new Date();
  const db = await getDb();

  if (db) {
    try {
      const inserted = await db
        .insert(logisticsRoutes)
        .values({
          ...route,
          consolidationCount: route.consolidationCount || 1,
          status: "planned",
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      if (inserted.length > 0) {
        memoryRoutes.unshift(inserted[0]);
        return inserted[0];
      }
    } catch (err) {
      console.warn("[Database] createLogisticsRoute fallback:", err);
    }
  }

  const memoryItem = {
    id: nextRouteId++,
    ...route,
    consolidationCount: route.consolidationCount || 1,
    status: "planned",
    createdAt: now,
    updatedAt: now,
  };
  memoryRoutes.unshift(memoryItem);
  return memoryItem;
}

export async function getUserSession(sessionId: string): Promise<AppUser | null> {
  const session = memorySessions.get(sessionId);
  if (!session || session.expiresAt < new Date()) {
    return null;
  }
  const users = Array.from(memoryUsers.values());
  for (const user of users) {
    if (user.id === session.userId) return user;
  }
  return null;
}

export async function logoutSession(sessionId: string): Promise<void> {
  memorySessions.delete(sessionId);
}
