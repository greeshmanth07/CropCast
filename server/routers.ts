import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  createBuyerRequirement,
  createProduceListing,
  findMatchingListings,
  getFarmerProfileByMobile,
  getMarketplaceSnapshot,
  getUserBySessionId,
  loginUser,
  placeMarketplaceOrder,
  registerUser,
  seedTomatoDemo,
  updateOrderStatus,
  upsertFarmerProfile,
} from "./db";
import { z } from "zod";

const normalizedMobile = z.string().transform((value) => value.replace(/\D/g, "").slice(-10)).pipe(z.string().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."));

export const registerInputSchema = z.object({
  fullName: z.string().trim().min(2, "Full Name must be at least 2 characters.").max(120),
  email: z.string().trim().email("Please enter a valid email address.").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters.").max(128),
  confirmPassword: z.string().min(1, "Please confirm your password."),
  role: z.enum(["farmer", "buyer", "admin"]).default("farmer"),
  location: z.string().trim().max(255).optional(),
  mobile: z.string().trim().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const loginInputSchema = z.object({
  emailOrMobile: z.string().trim().min(1, "Email or phone number is required."),
  password: z.string().min(1, "Password is required."),
  role: z.enum(["farmer", "buyer", "admin"]).optional(),
});

export const farmerProfileInputSchema = z.object({
  mobile: normalizedMobile,
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  location: z.string().trim().min(2, "Enter your location.").max(255),
  language: z.string().trim().min(2).max(32).default("English"),
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
    register: publicProcedure.input(registerInputSchema).mutation(async ({ input, ctx }) => {
      try {
        const { user, sessionId } = await registerUser({
          fullName: input.fullName,
          email: input.email,
          password: input.password,
          role: input.role,
          location: input.location,
          mobile: input.mobile,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            location: user.location,
          },
        };
      } catch (err: any) {
        if (err.message && err.message.includes("already exists")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "An account with this email address already exists. Please sign in instead.",
          });
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: err.message || "Failed to create account. Please check your details.",
        });
      }
    }),

    login: publicProcedure.input(loginInputSchema).mutation(async ({ input, ctx }) => {
      try {
        const { user, sessionId } = await loginUser({
          emailOrMobile: input.emailOrMobile,
          password: input.password,
          role: input.role,
        });

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionId, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile,
            role: user.role,
            location: user.location,
          },
        };
      } catch (err: any) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: err.message || "Invalid credentials.",
        });
      }
    }),

    me: publicProcedure.query(async ({ ctx }) => {
      const cookies = ctx.req.headers.cookie;
      if (!cookies) return null;
      const match = cookies.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE_NAME}=`));
      if (!match) return null;
      const sessionId = match.split("=")[1];
      const user = await getUserBySessionId(sessionId);
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        location: user.location,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  farmer: router({
    lookup: publicProcedure.input(z.object({ mobile: normalizedMobile })).mutation(({ input }) => getFarmerProfileByMobile(input.mobile)),
    save: publicProcedure.input(farmerProfileInputSchema).mutation(({ input }) => upsertFarmerProfile({
      mobile: input.mobile,
      fullName: input.fullName,
      location: input.location,
      language: input.language,
    })),
  }),

  marketplace: router({
    snapshot: publicProcedure.query(() => getMarketplaceSnapshot()),
    seedTomatoDemo: publicProcedure.mutation(() => seedTomatoDemo()),
    createListing: publicProcedure.input(listingInputSchema).mutation(({ input }) => createProduceListing(input)),
    createRequirement: publicProcedure.input(requirementInputSchema).mutation(({ input }) => createBuyerRequirement(input)),
    matches: publicProcedure.input(z.object({ requirementId: z.number().int().positive() })).query(({ input }) => findMatchingListings(input.requirementId)),
    placeOrder: publicProcedure.input(z.object({ listingId: z.number().int().positive(), requirementId: z.number().int().positive().optional(), buyerName: z.string().trim().min(2).max(160), quantityKg: z.number().int().positive() })).mutation(({ input }) => placeMarketplaceOrder(input)),
    updateOrderStatus: publicProcedure.input(z.object({ orderId: z.number().int().positive(), status: z.enum(["pickup_planned", "in_transit", "delivered"]) })).mutation(({ input }) => updateOrderStatus(input.orderId, input.status)),
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
