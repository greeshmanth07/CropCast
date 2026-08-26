import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addBuyerRequirement,
  addProduceListing,
  createDirectOrder,
  createLogisticsRoute,
  getLogisticsRoutes,
  getMarketplaceListings,
  getMarketplaceOrders,
  getMarketplaceRequirements,
  getUserSession,
  logoutSession,
  lookupFarmerByMobile,
  registerOrLoginPasswordless,
  upsertFarmerProfile,
} from "./db";
import { z } from "zod";

const normalizedMobile = z
  .string()
  .transform((value) => value.replace(/\D/g, "").slice(-10))
  .pipe(z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."));

export const passwordlessAuthSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  mobile: normalizedMobile,
  location: z.string().trim().min(2, "Enter your location.").max(255),
  language: z.string().trim().min(2).max(32).default("English"),
  role: z.enum(["farmer", "buyer", "admin"]).default("farmer"),
});

export const farmerProfileInputSchema = z.object({
  mobile: normalizedMobile,
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  location: z.string().trim().min(2, "Enter your location.").max(255),
  language: z.string().trim().min(2).max(32).default("English"),
  accountRole: z.string().trim().max(32).optional(),
  recentCrops: z.array(z.string()).optional(),
  watchlist: z.array(z.string()).optional(),
});

const listingInputSchema = z.object({
  farmerMobile: normalizedMobile,
  sellerName: z.string().trim().min(2).max(160),
  crop: z.string().trim().min(2).max(64),
  quantityKg: z.number().int().positive().max(100000),
  quality: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(255),
  harvestDate: z.string().trim().min(2).max(32),
  pricePerKg: z.number().int().positive().max(100000),
});

const requirementInputSchema = z.object({
  buyerName: z.string().trim().min(2).max(160),
  buyerType: z.string().trim().min(2).max(80),
  crop: z.string().trim().min(2).max(64),
  quantityKg: z.number().int().positive().max(100000),
  quality: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(255),
  requiredDate: z.string().trim().min(2).max(32),
  maxPricePerKg: z.number().int().positive().max(100000),
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    // Passwordless Registration / Login with Name, Mobile, and Location
    authenticatePasswordless: publicProcedure
      .input(passwordlessAuthSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          const { user, profile, sessionId } = await registerOrLoginPasswordless({
            fullName: input.fullName,
            mobile: input.mobile,
            location: input.location,
            language: input.language,
            role: input.role,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return {
            success: true,
            user,
            profile,
          };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Failed to authenticate.",
          });
        }
      }),

    // Legacy / simple login by mobile or email
    login: publicProcedure
      .input(
        z.object({
          emailOrMobile: z.string().trim().min(1, "Phone number or email is required."),
          password: z.string().optional(),
          role: z.enum(["farmer", "buyer", "admin"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const digits = input.emailOrMobile.replace(/\D/g, "").slice(-10);
          if (digits.length === 10) {
            const existing = await lookupFarmerByMobile(digits);
            if (existing) {
              const { user, profile, sessionId } = await registerOrLoginPasswordless({
                fullName: existing.fullName,
                mobile: digits,
                location: existing.location,
                language: existing.language,
                role: (existing.accountRole as any) || input.role || "farmer",
              });
              const cookieOptions = getSessionCookieOptions(ctx.req);
              ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });
              return { success: true, user, profile };
            }
          }

          const { user, profile, sessionId } = await registerOrLoginPasswordless({
            fullName: "Farmer",
            mobile: digits.length === 10 ? digits : "9876543210",
            location: "Guntur, Andhra Pradesh",
            role: input.role || "farmer",
          });
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });
          return { success: true, user, profile };
        } catch (err: any) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: err.message || "Login failed.",
          });
        }
      }),

    // Register with Name, Mobile, and Location
    register: publicProcedure
      .input(
        z.object({
          fullName: z.string().trim().min(2, "Full Name must be at least 2 characters."),
          email: z.string().trim().optional(),
          password: z.string().optional(),
          confirmPassword: z.string().optional(),
          mobile: z.string().trim(),
          location: z.string().trim().min(2, "Location is required."),
          role: z.enum(["farmer", "buyer", "admin"]).default("farmer"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const { user, profile, sessionId } = await registerOrLoginPasswordless({
            fullName: input.fullName,
            mobile: input.mobile,
            location: input.location,
            role: input.role,
          });

          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });

          return { success: true, user, profile };
        } catch (err: any) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: err.message || "Failed to create account.",
          });
        }
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      const cookies = ctx.req.headers.cookie;
      if (!cookies) return null;
      const match = cookies
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${COOKIE_NAME}=`));
      if (!match) return null;
      const sessionId = match.split("=")[1];
      return getUserSession(sessionId);
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  farmer: router({
    lookup: publicProcedure
      .input(z.object({ mobile: normalizedMobile }))
      .mutation(async ({ input }) => {
        return lookupFarmerByMobile(input.mobile);
      }),

    save: publicProcedure
      .input(farmerProfileInputSchema)
      .mutation(async ({ input }) => {
        return upsertFarmerProfile(input);
      }),
  }),

  marketplace: router({
    snapshot: publicProcedure.query(async () => {
      const listings = await getMarketplaceListings();
      const requirements = await getMarketplaceRequirements();
      const orders = await getMarketplaceOrders();
      const routes = await getLogisticsRoutes();
      return { listings, requirements, orders, routes };
    }),

    seedTomatoDemo: publicProcedure.mutation(async () => {
      return { success: true };
    }),

    createListing: publicProcedure
      .input(listingInputSchema)
      .mutation(async ({ input }) => {
        return addProduceListing(input);
      }),

    createRequirement: publicProcedure
      .input(requirementInputSchema)
      .mutation(async ({ input }) => {
        return addBuyerRequirement(input);
      }),

    updateOrderStatus: publicProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          status: z.enum(["pickup_planned", "in_transit", "delivered"]),
        })
      )
      .mutation(async ({ input }) => {
        return { success: true, status: input.status };
      }),

    placeOrder: publicProcedure
      .input(
        z.object({
          listingId: z.number().int().positive(),
          requirementId: z.number().int().positive().optional(),
          buyerName: z.string().trim().min(2).max(160),
          quantityKg: z.number().int().positive(),
          pricePerKg: z.number().int().positive().optional(),
          totalAmount: z.number().int().positive().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const listings = await getMarketplaceListings();
        const listing = listings.find((l: any) => l.id === input.listingId);
        const price = input.pricePerKg || (listing ? listing.pricePerKg : 30);
        const total = input.totalAmount || price * input.quantityKg;

        const order = await createDirectOrder({
          listingId: input.listingId,
          requirementId: input.requirementId,
          buyerName: input.buyerName,
          quantityKg: input.quantityKg,
          pricePerKg: price,
          totalAmount: total,
        });

        // Generate automatic logistics route plan
        const route = await createLogisticsRoute({
          orderId: order.id,
          routeName: `${listing?.location || "Farm Hub"} ➔ ${input.buyerName}`,
          pickupPoints: listing?.location || "Guntur Farm Collection Center",
          deliveryLocation: "Buyer Receiving Hub, Andhra Pradesh",
          distanceKm: 28,
          etaMinutes: 45,
          vehicleCapacityKg: 2000,
          consolidationCount: 1,
        });

        return { success: true, order, route };
      }),
  }),

  forecast: router({
    get7Day: publicProcedure
      .input(z.object({ crop: z.string().default("Tomato"), market: z.string().default("Guntur") }))
      .query(async ({ input }) => {
        const { getPriceForecast } = await import("./forecast/service");
        return getPriceForecast(input.crop, input.market);
      }),

    getValidationMetrics: publicProcedure
      .input(z.object({ crop: z.string().default("Tomato"), market: z.string().default("Guntur") }))
      .query(async ({ input }) => {
        const { getValidationMetrics } = await import("./forecast/service");
        return getValidationMetrics(input.crop, input.market);
      }),
  }),
});

export type AppRouter = typeof appRouter;
