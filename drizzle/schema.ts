import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Farmer records are keyed by the normalized 10-digit mobile number supplied in the AgriMarket registration flow. */
export const farmerProfiles = mysqlTable("farmerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  mobile: varchar("mobile", { length: 10 }).notNull().unique(),
  fullName: varchar("fullName", { length: 120 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  language: varchar("language", { length: 32 }).default("English").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FarmerProfile = typeof farmerProfiles.$inferSelect;
export type InsertFarmerProfile = typeof farmerProfiles.$inferInsert;

/** Farmer/FPO produce made available for direct consumer and bulk-buyer matching. */
export const produceListings = mysqlTable("produceListings", {
  id: int("id").autoincrement().primaryKey(),
  farmerMobile: varchar("farmerMobile", { length: 10 }).notNull(),
  sellerName: varchar("sellerName", { length: 160 }).notNull(),
  crop: varchar("crop", { length: 64 }).notNull(),
  quantityKg: int("quantityKg").notNull(),
  availableKg: int("availableKg").notNull(),
  quality: varchar("quality", { length: 80 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  harvestDate: varchar("harvestDate", { length: 32 }).notNull(),
  pricePerKg: int("pricePerKg").notNull(),
  status: mysqlEnum("status", ["available", "reserved", "sold"]).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A hotel, retailer, processor, or other bulk buyer's crop requirement. */
export const buyerRequirements = mysqlTable("buyerRequirements", {
  id: int("id").autoincrement().primaryKey(),
  buyerName: varchar("buyerName", { length: 160 }).notNull(),
  buyerType: varchar("buyerType", { length: 80 }).notNull(),
  crop: varchar("crop", { length: 64 }).notNull(),
  quantityKg: int("quantityKg").notNull(),
  quality: varchar("quality", { length: 80 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  requiredDate: varchar("requiredDate", { length: 32 }).notNull(),
  maxPricePerKg: int("maxPricePerKg").notNull(),
  status: mysqlEnum("status", ["open", "matched", "ordered", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A direct order that connects a matched produce listing to a buyer requirement. */
export const marketplaceOrders = mysqlTable("marketplaceOrders", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listingId").notNull(),
  requirementId: int("requirementId"),
  buyerName: varchar("buyerName", { length: 160 }).notNull(),
  quantityKg: int("quantityKg").notNull(),
  pricePerKg: int("pricePerKg").notNull(),
  totalAmount: int("totalAmount").notNull(),
  status: mysqlEnum("status", ["confirmed", "pickup_planned", "in_transit", "delivered"]).default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** A clear pickup-to-delivery plan for an order, including consolidation benefits. */
export const logisticsRoutes = mysqlTable("logisticsRoutes", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull().unique(),
  routeName: varchar("routeName", { length: 160 }).notNull(),
  pickupPoints: text("pickupPoints").notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  distanceKm: int("distanceKm").notNull(),
  etaMinutes: int("etaMinutes").notNull(),
  vehicleCapacityKg: int("vehicleCapacityKg").notNull(),
  consolidationCount: int("consolidationCount").default(1).notNull(),
  status: mysqlEnum("status", ["planned", "picking_up", "in_transit", "delivered"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProduceListing = typeof produceListings.$inferSelect;
export type BuyerRequirement = typeof buyerRequirements.$inferSelect;
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type LogisticsRoute = typeof logisticsRoutes.$inferSelect;
