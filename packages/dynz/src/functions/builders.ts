import type { ValueType } from "../types";
import type { Static } from "./types";

export function v<T extends ValueType>(value: T): Static<T> {
  return {
    type: "st",
    value,
  };
}

export const val = v;
export const st = v;
