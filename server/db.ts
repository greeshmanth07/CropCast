import crypto from "crypto";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { buyerRequirements, farmerProfiles, InsertFarmerProfile, InsertUser, logisticsRoutes, marketplaceOrders, produceListings, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { buildDemandForecast, buildRoutePlan } from "./matching";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// --------------------------------------------------------------------------
// SECURE PASSWORD HASHING (scrypt + random salt)
// --------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  try {
    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    const keyBuf = Buffer.from(key, "hex");
    const derivedBuf = Buffer.from(derivedKey, "hex");
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// IN-MEMORY DATA STORE (Local fallback when database is not connected)
// --------------------------------------------------------------------------
export interface AppUser {
  id: number;
  openId: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: "farmer" | "buyer" | "admin" | "user";
  location: string;
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

const memoryUsers: Map<string, AppUser> = new Map();
const memorySessions: Map<string, { userId: number; expiresAt: Date }> = new Map();

const memoryFarmerProfiles: Map<string, { id: number; mobile: string; fullName: string; location: string; language: string; createdAt: Date; updatedAt: Date }> = new Map([
  ["9876543210", { id: 1, mobile: "9876543210", fullName: "Ravi Kumar", location: "Tenali, Guntur, AP", language: "English", createdAt: new Date(), updatedAt: new Date() }],
  ["9000000000", { id: 2, mobile: "9000000000", fullName: "Lakshmi FPO", location: "Guntur FPO Hub", language: "English", createdAt: new Date(), updatedAt: new Date() }],
]);

let nextUserId = 10;
let nextListingId = 10;
let nextRequirementId = 10;
let nextOrderId = 10;
let nextRouteId = 10;

const memoryListings: any[] = [
  { id: 1, farmerMobile: "9000000000", sellerName: "Lakshmi FPO", crop: "Tomato", quantityKg: 1000, availableKg: 1000, quality: "A Grade", location: "Guntur FPO Collection Centre", harvestDate: "Fresh harvest · tomorrow", pricePerKg: 31, status: "available", createdAt: new Date(), updatedAt: new Date() },
  { id: 2, farmerMobile: "9876543210", sellerName: "Ravi Kumar", crop: "Chilli", quantityKg: 500, availableKg: 500, quality: "A Grade", location: "Tenali Market Yard", harvestDate: "Ready now", pricePerKg: 115, status: "available", createdAt: new Date(), updatedAt: new Date() },
];

const memoryRequirements: any[] = [
  { id: 1, buyerName: "Grand Kitchens Hotels", buyerType: "Hotel group", crop: "Tomato", quantityKg: 1000, quality: "A Grade", location: "Vijayawada Central Kitchen", requiredDate: "Required in 2 days", maxPricePerKg: 34, status: "open", createdAt: new Date(), updatedAt: new Date() },
];

const memoryOrders: any[] = [];
const memoryRoutes: any[] = [];

// --------------------------------------------------------------------------
// USER AUTHENTICATION & REGISTRATION
// --------------------------------------------------------------------------
export async function registerUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: "farmer" | "buyer" | "admin";
  location?: string;
  mobile?: string;
}): Promise<{ user: AppUser; sessionId: string }> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const db = await getDb();

  // 1. Check duplicate email in memory and DB
  if (memoryUsers.has(normalizedEmail)) {
    throw new Error("An account with this email address already exists.");
  }

  if (db) {
    const existing = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing.length > 0) {
      throw new Error("An account with this email address already exists.");
    }
  }

  // 2. Hash password securely
  const passwordHash = hashPassword(input.password);
  const now = new Date();
  const openId = `user_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const effectiveMobile = (input.mobile || "").replace(/\D/g, "").slice(-10) || `9${Date.now().toString().slice(-9)}`;
  const effectiveLocation = (input.location || "Andhra Pradesh").trim();

  const userRecord: AppUser = {
    id: nextUserId++,
    openId,
    name: input.fullName.trim(),
    email: normalizedEmail,
    mobile: effectiveMobile,
    passwordHash,
    role: input.role,
    location: effectiveLocation,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };

  memoryUsers.set(normalizedEmail, userRecord);

  // Sync with farmerProfiles if role is farmer
  if (input.role === "farmer") {
    memoryFarmerProfiles.set(effectiveMobile, {
      id: userRecord.id,
      mobile: effectiveMobile,
      fullName: userRecord.name,
      location: effectiveLocation,
      language: "English",
      createdAt: now,
      updatedAt: now,
    });
  }

  if (db) {
    try {
      await db.insert(users).values({
        openId,
        name: userRecord.name,
        email: normalizedEmail,
        loginMethod: "password",
        role: input.role === "admin" ? "admin" : "user",
        createdAt: now,
        updatedAt: now,
        lastSignedIn: now,
      });
      if (input.role === "farmer") {
        await db.insert(farmerProfiles).values({
          mobile: effectiveMobile,
          fullName: userRecord.name,
          location: effectiveLocation,
          language: "English",
        }).onDuplicateKeyUpdate({
          set: { fullName: userRecord.name, location: effectiveLocation },
        });
      }
    } catch (dbErr) {
      console.warn("[Database] Registration DB insert fallback to memory:", dbErr);
    }
  }

  // 3. Create Session
  const sessionId = crypto.randomUUID();
  memorySessions.set(sessionId, {
    userId: userRecord.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  });

  return { user: userRecord, sessionId };
}

export async function loginUser(input: {
  emailOrMobile: string;
  password: string;
  role?: "farmer" | "buyer" | "admin";
}): Promise<{ user: AppUser; sessionId: string }> {
  const query = input.emailOrMobile.trim().toLowerCase();
  const digits = query.replace(/\D/g, "").slice(-10);

  // 1. Find user in memory
  let foundUser: AppUser | undefined = undefined;
  for (const user of memoryUsers.values()) {
    if (user.email === query || (digits.length === 10 && user.mobile === digits)) {
      foundUser = user;
      break;
    }
  }

  // 2. If not found in memory, check DB
  if (!foundUser) {
    const db = await getDb();
    if (db) {
      const dbUser = (await db.select().from(users).where(eq(users.email, query)).limit(1))[0];
      if (dbUser) {
        foundUser = {
          id: dbUser.id,
          openId: dbUser.openId,
          name: dbUser.name || "User",
          email: dbUser.email || query,
          mobile: digits || "9876543210",
          passwordHash: "", // will be checked if available
          role: (dbUser.role as any) || input.role || "farmer",
          location: "Andhra Pradesh",
          createdAt: dbUser.createdAt,
          updatedAt: dbUser.updatedAt,
          lastSignedIn: dbUser.lastSignedIn,
        };
      }
    }
  }

  // If farmer mobile lookup matches demo profiles, allow seamless login
  if (!foundUser && digits.length === 10 && memoryFarmerProfiles.has(digits)) {
    const farmer = memoryFarmerProfiles.get(digits)!;
    foundUser = {
      id: farmer.id,
      openId: `farmer_${digits}`,
      name: farmer.fullName,
      email: `${digits}@cropcast.local`,
      mobile: digits,
      passwordHash: hashPassword(input.password || "password123"),
      role: input.role || "farmer",
      location: farmer.location,
      createdAt: farmer.createdAt,
      updatedAt: farmer.updatedAt,
      lastSignedIn: new Date(),
    };
    memoryUsers.set(foundUser.email, foundUser);
  }

  if (!foundUser) {
    throw new Error("No account found with this email or phone number.");
  }

  // 3. Verify password
  if (foundUser.passwordHash && !verifyPassword(input.password, foundUser.passwordHash)) {
    throw new Error("Invalid password. Please check your credentials.");
  }

  foundUser.lastSignedIn = new Date();
  if (input.role && foundUser.role !== input.role) {
    foundUser.role = input.role;
  }

  const sessionId = crypto.randomUUID();
  memorySessions.set(sessionId, {
    userId: foundUser.id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return { user: foundUser, sessionId };
}

export async function getUserBySessionId(sessionId: string): Promise<AppUser | null> {
  if (!sessionId) return null;
  const session = memorySessions.get(sessionId);
  if (!session || session.expiresAt < new Date()) {
    if (session) memorySessions.delete(sessionId);
    return null;
  }
  for (const user of memoryUsers.values()) {
    if (user.id === session.userId) {
      return user;
    }
  }
  return null;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    textFields.forEach((field) => {
      if (user[field] !== undefined) {
        values[field] = user[field] ?? null;
        updateSet[field] = user[field] ?? null;
      }
    });
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }
    values.lastSignedIn = user.lastSignedIn || new Date();
    updateSet.lastSignedIn = values.lastSignedIn;
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    for (const u of memoryUsers.values()) {
      if (u.openId === openId) return u;
    }
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getFarmerProfileByMobile(mobile: string) {
  const cleanMobile = mobile.replace(/\D/g, "").slice(-10);
  const db = await getDb();
  if (db) {
    try {
      const result = await db.select().from(farmerProfiles).where(eq(farmerProfiles.mobile, cleanMobile)).limit(1);
      if (result.length > 0) return result[0];
    } catch {}
  }
  return memoryFarmerProfiles.get(cleanMobile) ?? null;
}

export async function upsertFarmerProfile(profile: InsertFarmerProfile) {
  const cleanMobile = profile.mobile.replace(/\D/g, "").slice(-10);
  const cleanProfile = { ...profile, mobile: cleanMobile };
  const now = new Date();

  memoryFarmerProfiles.set(cleanMobile, {
    id: 1,
    mobile: cleanMobile,
    fullName: cleanProfile.fullName,
    location: cleanProfile.location,
    language: cleanProfile.language || "English",
    createdAt: now,
    updatedAt: now,
  });

  const db = await getDb();
  if (db) {
    try {
      await db.insert(farmerProfiles).values(cleanProfile).onDuplicateKeyUpdate({
        set: {
          fullName: cleanProfile.fullName,
          location: cleanProfile.location,
          language: cleanProfile.language,
        },
      });
    } catch (err) {
      console.warn("[Database] farmerProfiles upsert fallback to memory:", err);
    }
  }

  return getFarmerProfileByMobile(cleanMobile);
}

// --------------------------------------------------------------------------
// MARKETPLACE & LOGISTICS
// --------------------------------------------------------------------------
export type CreateListingInput = {
  farmerMobile: string;
  sellerName: string;
  crop: string;
  quantityKg: number;
  quality: string;
  location: string;
  harvestDate: string;
  pricePerKg: number;
};

export type CreateRequirementInput = {
  buyerName: string;
  buyerType: string;
  crop: string;
  quantityKg: number;
  quality: string;
  location: string;
  requiredDate: string;
  maxPricePerKg: number;
};

export async function listProduceListings() {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(produceListings).orderBy(desc(produceListings.createdAt)).limit(30);
    } catch {}
  }
  return [...memoryListings].reverse();
}

export async function createProduceListing(input: CreateListingInput) {
  const cleanMobile = input.farmerMobile.replace(/\D/g, "").slice(-10);
  const newListing = {
    id: nextListingId++,
    farmerMobile: cleanMobile,
    sellerName: input.sellerName,
    crop: input.crop,
    quantityKg: input.quantityKg,
    availableKg: input.quantityKg,
    quality: input.quality,
    location: input.location,
    harvestDate: input.harvestDate,
    pricePerKg: input.pricePerKg,
    status: "available" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryListings.push(newListing);

  const db = await getDb();
  if (db) {
    try {
      await db.insert(produceListings).values({ ...input, farmerMobile: cleanMobile, availableKg: input.quantityKg, status: "available" });
    } catch (err) {
      console.warn("[Database] createProduceListing fallback:", err);
    }
  }

  return newListing;
}

export async function listBuyerRequirements() {
  const db = await getDb();
  if (db) {
    try {
      return await db.select().from(buyerRequirements).orderBy(desc(buyerRequirements.createdAt)).limit(30);
    } catch {}
  }
  return [...memoryRequirements].reverse();
}

export async function createBuyerRequirement(input: CreateRequirementInput) {
  const newReq = {
    id: nextRequirementId++,
    ...input,
    status: "open" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryRequirements.push(newReq);

  const db = await getDb();
  if (db) {
    try {
      await db.insert(buyerRequirements).values({ ...input, status: "open" });
    } catch (err) {
      console.warn("[Database] createBuyerRequirement fallback:", err);
    }
  }

  return newReq;
}

export async function findMatchingListings(requirementId: number) {
  let requirement: any = memoryRequirements.find((r) => r.id === requirementId);
  const db = await getDb();
  if (!requirement && db) {
    try {
      requirement = (await db.select().from(buyerRequirements).where(eq(buyerRequirements.id, requirementId)).limit(1))[0];
    } catch {}
  }
  if (!requirement) throw new Error("Buyer requirement not found");

  const listings = await listProduceListings();
  return listings.filter((listing: any) =>
    listing.status !== "sold" &&
    listing.crop.toLowerCase() === requirement.crop.toLowerCase() &&
    listing.availableKg > 0 &&
    listing.pricePerKg <= requirement.maxPricePerKg
  ).map((listing: any) => ({
    ...listing,
    qualityMatch: listing.quality.toLowerCase() === requirement.quality.toLowerCase(),
    quantityCoverage: Math.min(100, Math.round((listing.availableKg / requirement.quantityKg) * 100)),
    distanceNote: listing.location.toLowerCase().includes("guntur") && requirement.location.toLowerCase().includes("vijayawada") ? "48 km optimized route" : "Local route available",
  }));
}

export async function placeMarketplaceOrder(input: { listingId: number; requirementId?: number; buyerName: string; quantityKg: number }) {
  const listings = await listProduceListings();
  const listing = listings.find((l: any) => l.id === input.listingId);
  if (!listing) throw new Error("Produce listing not found");
  if (listing.availableKg < input.quantityKg) throw new Error("The requested quantity is no longer available");

  const totalAmount = listing.pricePerKg * input.quantityKg;
  const newOrder = {
    id: nextOrderId++,
    listingId: listing.id,
    requirementId: input.requirementId ?? null,
    buyerName: input.buyerName,
    quantityKg: input.quantityKg,
    pricePerKg: listing.pricePerKg,
    totalAmount,
    status: "confirmed" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryOrders.push(newOrder);

  // Update remaining quantity
  listing.availableKg -= input.quantityKg;
  if (listing.availableKg <= 0) listing.status = "sold";

  // Build Route
  const plan = buildRoutePlan(listing.location, "Vijayawada Central Hub", input.quantityKg);
  const newRoute = {
    id: nextRouteId++,
    orderId: newOrder.id,
    ...plan,
    status: "planned" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  memoryRoutes.push(newRoute);

  const db = await getDb();
  if (db) {
    try {
      await db.insert(marketplaceOrders).values(newOrder as any);
      await db.update(produceListings).set({ availableKg: listing.availableKg, status: listing.status }).where(eq(produceListings.id, listing.id));
      if (input.requirementId) await db.update(buyerRequirements).set({ status: "ordered" }).where(eq(buyerRequirements.id, input.requirementId));
      await db.insert(logisticsRoutes).values(newRoute as any);
    } catch (err) {
      console.warn("[Database] placeMarketplaceOrder DB fallback:", err);
    }
  }

  return { order: newOrder, route: newRoute };
}

export async function updateOrderStatus(orderId: number, status: "pickup_planned" | "in_transit" | "delivered") {
  const order = memoryOrders.find((o) => o.id === orderId);
  if (order) order.status = status;

  const route = memoryRoutes.find((r) => r.orderId === orderId);
  if (route) {
    route.status = status === "pickup_planned" ? "picking_up" : status === "in_transit" ? "in_transit" : "delivered";
  }

  const db = await getDb();
  if (db) {
    try {
      await db.update(marketplaceOrders).set({ status }).where(eq(marketplaceOrders.id, orderId));
      if (route) await db.update(logisticsRoutes).set({ status: route.status }).where(eq(logisticsRoutes.orderId, orderId));
    } catch {}
  }

  return order ?? null;
}

export async function getMarketplaceSnapshot() {
  const listings = await listProduceListings();
  const requirements = await listBuyerRequirements();
  const orders = [...memoryOrders].reverse();
  const routes = [...memoryRoutes].reverse();

  const tomatoListing = listings.find((listing: any) => listing.crop.toLowerCase() === "tomato") ?? listings[0];
  const forecast = tomatoListing ? buildDemandForecast(tomatoListing.crop, tomatoListing.availableKg) : buildDemandForecast("tomato", 1000);

  return { listings, requirements, orders, routes, forecast };
}

export async function seedTomatoDemo() {
  const listings = await listProduceListings();
  const requirements = await listBuyerRequirements();
  let listing = listings.find((item: any) => item.crop.toLowerCase() === "tomato" && item.sellerName === "Lakshmi FPO" && item.availableKg >= 1000);
  if (!listing) {
    listing = await createProduceListing({
      farmerMobile: "9000000000",
      sellerName: "Lakshmi FPO",
      crop: "Tomato",
      quantityKg: 1000,
      quality: "A Grade",
      location: "Guntur FPO Collection Centre",
      harvestDate: "Fresh harvest · tomorrow",
      pricePerKg: 31,
    });
  }

  let requirement = requirements.find((item: any) => item.crop.toLowerCase() === "tomato" && item.buyerName === "Grand Kitchens Hotels" && item.status === "open");
  if (!requirement) {
    requirement = await createBuyerRequirement({
      buyerName: "Grand Kitchens Hotels",
      buyerType: "Hotel group",
      crop: "Tomato",
      quantityKg: 1000,
      quality: "A Grade",
      location: "Vijayawada Central Kitchen",
      requiredDate: "Required in 2 days",
      maxPricePerKg: 34,
    });
  }

  return { listing, requirement, forecast: buildDemandForecast("tomato", listing?.availableKg ?? 1000) };
}
