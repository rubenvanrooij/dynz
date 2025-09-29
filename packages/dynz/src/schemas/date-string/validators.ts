import type { ValidateRuleContextUnion } from "../../types";
import type { DateStringSchema } from "./types";

// @ts-expect-error - tmp
export function validateDateString(context: ValidateRuleContextUnion<DateStringSchema>) {
  throw new Error("Not yet implemented...");
}
