import { describe, expect, it } from "vitest";
import { max, number, object, ref, validate } from "../../index";

describe("max function", () => {
  it("should return maximum of static values", async () => {
    const schema = object({
      value: number().min(max(10, 20, 5)),
    });

    expect((await validate(schema, undefined, { value: 20 })).success).toBe(true);
    expect((await validate(schema, undefined, { value: 19 })).success).toBe(false);
  });

  it("should return maximum with references", async () => {
    const schema = object({
      floor1: number(),
      floor2: number(),
      value: number().min(max(ref("floor1"), ref("floor2"))),
    });

    expect((await validate(schema, undefined, { floor1: 10, floor2: 20, value: 20 })).success).toBe(true);
    expect((await validate(schema, undefined, { floor1: 10, floor2: 20, value: 15 })).success).toBe(false);
  });

  it("should work with mixed static and reference values", async () => {
    const schema = object({
      dynamicFloor: number(),
      value: number().min(max(ref("dynamicFloor"), 10)),
    });

    // Dynamic floor is 50, so min is 50
    expect((await validate(schema, undefined, { dynamicFloor: 50, value: 50 })).success).toBe(true);
    expect((await validate(schema, undefined, { dynamicFloor: 50, value: 25 })).success).toBe(false);

    // Dynamic floor is 5, so min is 10 (static)
    expect((await validate(schema, undefined, { dynamicFloor: 5, value: 10 })).success).toBe(true);
    expect((await validate(schema, undefined, { dynamicFloor: 5, value: 9 })).success).toBe(false);
  });
});
