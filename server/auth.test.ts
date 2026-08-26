import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword } from "./db";

type CookieCall = {
  name: string;
  value: string;
  options: Record<string, unknown>;
};

function createMockContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: any[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: any[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

describe("Password Hashing & Verification", () => {
  it("generates salted scrypt hashes that never store plaintext", () => {
    const rawPassword = "SecretPassword123";
    const hash = hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toContain(":");
    expect(hash.split(":").length).toBe(2);

    // Verify correct password
    expect(verifyPassword(rawPassword, hash)).toBe(true);
    // Verify incorrect password
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });
});

describe("auth.register and auth.login flow", () => {
  it("successfully registers a new farmer account and sets session cookie", async () => {
    const { ctx, setCookies } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const testEmail = `farmer_${Date.now()}@example.com`;
    const result = await caller.auth.register({
      fullName: "Suresh Kumar",
      email: testEmail,
      password: "StrongPassword123",
      confirmPassword: "StrongPassword123",
      role: "farmer",
      location: "Guntur Mandi",
      mobile: "9876543211",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Suresh Kumar");
    expect(result.user.email).toBe(testEmail);
    expect(result.user.role).toBe("farmer");
    expect(setCookies.length).toBeGreaterThanOrEqual(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("prevents duplicate registration with the same email", async () => {
    const { ctx } = createMockContext();
    const caller = appRouter.createCaller(ctx);

    const duplicateEmail = `duplicate_${Date.now()}@example.com`;
    await caller.auth.register({
      fullName: "Original Farmer",
      email: duplicateEmail,
      password: "Password123",
      confirmPassword: "Password123",
      role: "farmer",
    });

    // Attempt duplicate registration
    await expect(
      caller.auth.register({
        fullName: "Another Person",
        email: duplicateEmail,
        password: "DifferentPassword123",
        confirmPassword: "DifferentPassword123",
        role: "farmer",
      })
    ).rejects.toThrow(/already exists/);
  });

  it("successfully logs in with registered email and password", async () => {
    const { ctx: regCtx } = createMockContext();
    const regCaller = appRouter.createCaller(regCtx);

    const email = `login_test_${Date.now()}@example.com`;
    await regCaller.auth.register({
      fullName: "Priya Sharma",
      email,
      password: "MySecurePassword123",
      confirmPassword: "MySecurePassword123",
      role: "buyer",
      location: "Vijayawada",
    });

    const { ctx: loginCtx, setCookies } = createMockContext();
    const loginCaller = appRouter.createCaller(loginCtx);

    const loginResult = await loginCaller.auth.login({
      emailOrMobile: email,
      password: "MySecurePassword123",
    });

    expect(loginResult.success).toBe(true);
    expect(loginResult.user.name).toBe("Priya Sharma");
    expect(loginResult.user.email).toBe(email);
    expect(loginResult.user.role).toBe("buyer");
    expect(setCookies.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects login with invalid password", async () => {
    const { ctx: regCtx } = createMockContext();
    const regCaller = appRouter.createCaller(regCtx);

    const email = `invalid_pass_${Date.now()}@example.com`;
    await regCaller.auth.register({
      fullName: "Venkat Rao",
      email,
      password: "CorrectPassword123",
      confirmPassword: "CorrectPassword123",
      role: "farmer",
    });

    const { ctx: loginCtx } = createMockContext();
    const loginCaller = appRouter.createCaller(loginCtx);

    await expect(
      loginCaller.auth.login({
        emailOrMobile: email,
        password: "IncorrectPassword!",
      })
    ).rejects.toThrow(/Invalid password/);
  });
});
