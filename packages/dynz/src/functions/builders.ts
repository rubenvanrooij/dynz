import type { ValueType } from "../types";
import { STATIC_TYPE, type Static } from "./types";

export function v<T extends ValueType>(value: T): Static<T> {
  return {
    type: STATIC_TYPE,
    value,
  };
}

export const val = v;
export const st = v;
