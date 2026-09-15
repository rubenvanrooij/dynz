import { object, string } from "dynz";
import { describe, expect, it } from "vitest";
import { step, transition } from "./define";
import { isStepValid, validateStep } from "./validate";

const personalInfo = step("personalInfo", object({ name: string().min(2) }), { next: [transition(null)] });

describe("validateStep", () => {
  it("delegates to dynz's validate() for the step's own schema", async () => {
    const result = await validateStep(personalInfo, undefined, { name: "Ada" });
    expect(result).toEqual({ success: true, values: { name: "Ada" } });
  });

  it("surfaces validation errors from the step's schema", async () => {
    const result = await validateStep(personalInfo, undefined, { name: "A" });
    expect(result.success).toBe(false);
  });
});

describe("isStepValid", () => {
  it("returns true for valid input", async () => {
    expect(await isStepValid(personalInfo, undefined, { name: "Ada" })).toBe(true);
  });

  it("returns false for invalid input", async () => {
    expect(await isStepValid(personalInfo, undefined, { name: "A" })).toBe(false);
  });
});
