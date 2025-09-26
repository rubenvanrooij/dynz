import { isObject } from "../validate";
import type { PrivateValue } from "./types";

export function isPivateValue<T>(value: unknown): value is PrivateValue<T> {
  return isObject(value) && (value.state === "masked" || value.state === "plain") && "value" in value;
}
