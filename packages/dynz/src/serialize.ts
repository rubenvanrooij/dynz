import type { Schema } from "./types";

export function serialize(schema: Schema): string {
  return JSON.stringify(schema);
}
