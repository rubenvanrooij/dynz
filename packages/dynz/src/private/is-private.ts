import type { Schema } from "../types";
import { isObject } from "../validate/validate-type";
import type { MaskedPrivateValue, PrivateValue } from "./types";

export function isPrivateValue<T>(value: unknown): value is PrivateValue<T> {
  return isObject(value) && (value.state === "masked" || value.state === "plain") && "value" in value;
}

/** @deprecated misspelled; use {@link isPrivateValue} */
export const isPivateValue = isPrivateValue;

export function isMaskedValue(value: unknown): value is MaskedPrivateValue {
  return isPrivateValue(value) && value.state === "masked";
}

/** Whether a schema is marked private, via `setPrivate(true)` or `setPrivate({ mask })`. */
export function isPrivateSchema(schema: Schema): boolean {
  const config = "private" in schema ? schema.private : undefined;
  return config === true || isObject(config);
}

/** The named masker a private schema asked for, if any. */
export function getMaskName(schema: Schema): string | undefined {
  const config = "private" in schema ? schema.private : undefined;
  return isObject(config) && typeof config.mask === "string" ? config.mask : undefined;
}
