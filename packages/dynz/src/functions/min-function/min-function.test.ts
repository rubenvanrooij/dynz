import { describe, expect, it } from "vitest";
import { min, number, object, ref, validate } from "../../index";

describe("min function", () => {
  it("should return minimum of static values", async () => {
    const schema = object({
      value: number().max(min(10, 20, 5)),
    });

    expect((await validate(schema, undefined, { value: 5 })).success).toBe(true);
    expect((await validate(schema, undefined, { value: 6 })).success).toBe(false);
  });

  it("should return minimum with references", async () => {
    const schema = object({
      limit1: number(),
      limit2: number(),
      value: number().max(min(ref("limit1"), ref("limit2"))),
    });

    expect((await validate(schema, undefined, { limit1: 10, limit2: 20, value: 10 })).success).toBe(true);
    expect((await validate(schema, undefined, { limit1: 10, limit2: 20, value: 15 })).success).toBe(false);
  });

  it("should work with mixed static and reference values", async () => {
    const schema = object({
      dynamicLimit: number(),
      value: number().max(min(ref("dynamicLimit"), 100)),
    });

    // Dynamic limit is 50, so max is 50
    expect((await validate(schema, undefined, { dynamicLimit: 50, value: 50 })).success).toBe(true);
    expect((await validate(schema, undefined, { dynamicLimit: 50, value: 75 })).success).toBe(false);

    // Dynamic limit is 150, so max is 100 (static)
    expect((await validate(schema, undefined, { dynamicLimit: 150, value: 100 })).success).toBe(true);
    expect((await validate(schema, undefined, { dynamicLimit: 150, value: 101 })).success).toBe(false);
  });
});
