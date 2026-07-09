import { resolvePredicate } from "../../functions";
import type { ResolveContext, Schema } from "../../types";
import { DISCRIMINATOR_TYPE, type Discriminator } from "./types";

/**
 * Whether a discriminated union member's entry is the discriminator key's `Discriminator`
 * rather than a regular `Schema` field. A positive check on `.type`, mirroring how every other
 * schema kind is distinguished — `Discriminator` is deliberately not part of the `Schema`
 * union, so this is the one place that has to look.
 */
export function isDiscriminator(value: Schema | Discriminator): value is Discriminator {
  return value.type === DISCRIMINATOR_TYPE;
}

/**
 * Whether a discriminator is currently enabled. `enabled: undefined` (or omitted) means always
 * enabled; a boolean is used as-is; a `Predicate` is resolved the same way `options()` resolves
 * a `DynamicOptionValue["enabled"]` (see `isOption` in `validate/validate-type.ts`).
 */
export function isDiscriminatorEnabled(discriminator: Discriminator, path: string, context: ResolveContext): boolean {
  if (discriminator.enabled === undefined || typeof discriminator.enabled === "boolean") {
    return discriminator.enabled ?? true;
  }

  return resolvePredicate(discriminator.enabled, path, context) ?? false;
}
