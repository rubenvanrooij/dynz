import type { Schema } from "../types";
import { isMaskedValue, isPrivateSchema } from "./is-private";

export function isValueMasked<T extends Schema>(schema: T, value: unknown): boolean {
  return isPrivateSchema(schema) && isMaskedValue(value);
}
