import { integer, pgEnum, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const produceStatusEnum = pgEnum("produce_status", ["available", "reserved", "sold"]);
export const buyerReqStatusEnum = pgEnum("buyer_req_status", ["open", "matched", "ordered", "closed"]);
export const orderStatusEnum = pgEnum("order_status", ["confirmed", "pickup_planned", "in_transit", "delivered"]);
export const logisticsStatusEnum = pgEnum("logistics_status", ["planned", "picking_up", "in_transit", "delivered"]);

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Farmer and user records keyed by the normalized 10-digit mobile number supplied in the registration flow. */
export const farmerProfiles = pgTable("farmerProfiles", {
  id: serial("id").primaryKey(),
  mobile: varchar("mobile", { length: 10 }).notNull().unique(),
  fullName: varchar("fullName", { length: 120 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  language: varchar("language", { length: 32 }).default("English").notNull(),
  accountRole: varchar("accountRole", { length: 32 }).default("farmer").notNull(),
  recentCrops: text("recentCrops"),
  watchlist: text("watchlist"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type FarmerProfile = typeof farmerProfiles.$inferSelect;
export type InsertFarmerProfile = typeof farmerProfiles.$inferInsert;

/** Farmer/FPO produce made available for direct consumer and bulk-buyer matching. */
export const produceListings = pgTable("produceListings", {
  id: serial("id").primaryKey(),
  farmerMobile: varchar("farmerMobile", { length: 10 }).notNull(),
  sellerName: varchar("sellerName", { length: 160 }).notNull(),
  crop: varchar("crop", { length: 64 }).notNull(),
  quantityKg: integer("quantityKg").notNull(),
  availableKg: integer("availableKg").notNull(),
  quality: varchar("quality", { length: 80 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  harvestDate: varchar("harvestDate", { length: 32 }).notNull(),
  pricePerKg: integer("pricePerKg").notNull(),
  status: varchar("status", { length: 32 }).default("available").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/** A hotel, retailer, processor, or other bulk buyer's crop requirement. */
export const buyerRequirements = pgTable("buyerRequirements", {
  id: serial("id").primaryKey(),
  buyerName: varchar("buyerName", { length: 160 }).notNull(),
  buyerType: varchar("buyerType", { length: 80 }).notNull(),
  crop: varchar("crop", { length: 64 }).notNull(),
  quantityKg: integer("quantityKg").notNull(),
  quality: varchar("quality", { length: 80 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  requiredDate: varchar("requiredDate", { length: 32 }).notNull(),
  maxPricePerKg: integer("maxPricePerKg").notNull(),
  status: varchar("status", { length: 32 }).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/** A direct order that connects a matched produce listing to a buyer requirement. */
export const marketplaceOrders = pgTable("marketplaceOrders", {
  id: serial("id").primaryKey(),
  listingId: integer("listingId").notNull(),
  requirementId: integer("requirementId"),
  buyerName: varchar("buyerName", { length: 160 }).notNull(),
  quantityKg: integer("quantityKg").notNull(),
  pricePerKg: integer("pricePerKg").notNull(),
  totalAmount: integer("totalAmount").notNull(),
  status: varchar("status", { length: 32 }).default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/** A clear pickup-to-delivery plan for an order, including consolidation benefits. */
export const logisticsRoutes = pgTable("logisticsRoutes", {
  id: serial("id").primaryKey(),
  orderId: integer("orderId").notNull().unique(),
  routeName: varchar("routeName", { length: 160 }).notNull(),
  pickupPoints: text("pickupPoints").notNull(),
  deliveryLocation: varchar("deliveryLocation", { length: 255 }).notNull(),
  distanceKm: integer("distanceKm").notNull(),
  etaMinutes: integer("etaMinutes").notNull(),
  vehicleCapacityKg: integer("vehicleCapacityKg").notNull(),
  consolidationCount: integer("consolidationCount").default(1).notNull(),
  status: varchar("status", { length: 32 }).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type ProduceListing = typeof produceListings.$inferSelect;
export type BuyerRequirement = typeof buyerRequirements.$inferSelect;
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type LogisticsRoute = typeof logisticsRoutes.$inferSelect;
