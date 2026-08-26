import { describe, expect, it } from "vitest";
import { farmerProfileInputSchema } from "./routers";

describe("farmer profile registration input", () => {
  it("normalizes an Indian mobile number while retaining the submitted farmer details", () => {
    const result = farmerProfileInputSchema.parse({
      fullName: "Ravi Kumar",
      mobile: "+91 98765 43210",
      location: "Guntur, Andhra Pradesh",
      language: "English",
    });

    expect(result.mobile).toBe("9876543210");
    expect(result.fullName).toBe("Ravi Kumar");
    expect(result.location).toBe("Guntur, Andhra Pradesh");
  });

  it("rejects incomplete mobile registration input", () => {
    expect(() => farmerProfileInputSchema.parse({
      fullName: "R",
      mobile: "12345",
      location: "",
      language: "English",
    })).toThrow();
  });
});
