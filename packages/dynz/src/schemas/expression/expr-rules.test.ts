import { describe, expect, it } from "vitest";
import * as d from "./src/index";

describe("expression schema rules", () => {
  const schema = d.object({
    width: d.number(),
    items: d.array(d.object({ width: d.number() })),
    itemsWidth: d.expr(d.sum(d.pluck(d.ref("items"), "width"))).setRules([d.max(d.sub(d.ref("width"), d.v(10)))]),
  });

  it("passes when sum of item widths <= width - 10", async () => {
    // sum(10, 20) = 30 <= 50 - 10 = 40
    const result = await d.validate(schema, undefined, {
      width: 50,
      items: [{ width: 10 }, { width: 20 }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.values.itemsWidth).toBe(30);
  });

  it("fails when sum of item widths > width - 10", async () => {
    // sum(20, 25) = 45 > 50 - 10 = 40
    const result = await d.validate(schema, undefined, {
      width: 50,
      items: [{ width: 20 }, { width: 25 }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe("max");
      expect(result.errors[0].path).toBe("$.itemsWidth");
    }
  });
});
