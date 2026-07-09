import { resolvePredicate } from "../../functions";
import type { ResolveContext, Schema } from "../../types";
import { isBoolean, isNumber, isString } from "../../validate/validate-type";
import type { DynamicOptionValue } from "../options/types";

/**
 * Whether a discriminated union member's raw entry is a `DynamicOptionValue`
 * (`{ value, enabled }`) rather than a plain primitive or a nested `Schema`.
 * `Schema` objects always carry a `type` discriminant, which `DynamicOptionValue`
 * never does.
 */
export function isDynamicDiscriminatorValue(
  value: Schema | string | number | boolean | DynamicOptionValue
): value is DynamicOptionValue {
  return typeof value === "object" && value !== null && !("type" in value);
}

/**
 * Unwraps a discriminator entry to its literal value, regardless of whether
 * it's a plain primitive or a `DynamicOptionValue`. Only ever called on the
 * discriminator key's entry, which is never actually a `Schema` at runtime
 * (accepting the full `DiscriminatorEntry` type just avoids casts at call
 * sites, since member entries are generically typed as `Schema | ...`).
 */
export function getDiscriminatorLiteral(
  value: Schema | string | number | boolean | DynamicOptionValue
): string | number | boolean | undefined {
  if (isDynamicDiscriminatorValue(value)) {
    return value.value;
  }

  if (isString(value) || isNumber(value) || isBoolean(value)) {
    return value;
  }

  return undefined;
}

/**
 * Whether a discriminator entry is currently enabled. Plain primitives are
 * always enabled; `DynamicOptionValue` entries resolve their `enabled` flag
 * (boolean or Predicate) the same way `options()` does (see `isOption` in
 * `validate/validate-type.ts`).
 */
export function isDiscriminatorEnabled(
  value: Schema | string | number | boolean | DynamicOptionValue,
  path: string,
  context: ResolveContext
): boolean {
  if (!isDynamicDiscriminatorValue(value)) {
    return true;
  }

  if (typeof value.enabled === "boolean") {
    return value.enabled;
  }

  const resolved = resolvePredicate(value.enabled, path, context);

  return resolved === undefined ? false : resolved;
}
