import type { Schema, SchemaInput } from "../types";
import { plain } from "./builder";
import { isMaskedValue, isPrivateValue } from "./is-private";
import type { MaskedPrivateValue } from "./types";
import { walkPrivateLeaves } from "./walk-private-leaves";

/**
 * Prepares a server payload for a form: every private field becomes a raw value, a
 * masked one showing its mask (`"****4300"`), so inputs can bind to it directly.
 */
export function toFormValues<T extends Schema>(schema: T, values: unknown): unknown {
  return walkPrivateLeaves<never>(schema, values, "$", (value) => ({
    value: isPrivateValue(value) ? value.value : value,
    marks: [],
  })).value;
}

/**
 * The inverse of {@link toFormValues}: wraps every private field for submission. A
 * field still showing the mask it was given is sent back as the mask marker
 * ("unchanged"); anything else is sent as `plain(value)`.
 *
 * @param formValues the raw form state
 * @param serverValues the masked payload the form was seeded with
 */
export function toSubmitValues<T extends Schema>(
  schema: T,
  formValues: unknown,
  serverValues: unknown
): SchemaInput<T> {
  const masks = walkPrivateLeaves<{ path: string; marker: MaskedPrivateValue }>(
    schema,
    serverValues,
    "$",
    (value, path) => ({ value, marks: isMaskedValue(value) ? [{ path, marker: value }] : [] })
  ).marks;

  return walkPrivateLeaves<never>(schema, formValues, "$", (value, path) => {
    if (isPrivateValue(value)) {
      return { value, marks: [] };
    }

    const mask = masks.find((candidate) => candidate.path === path);

    if (mask !== undefined && mask.marker.value === value) {
      return { value: mask.marker, marks: [] };
    }

    return { value: value === undefined || value === null ? value : plain(value as string | number), marks: [] };
  }).value as SchemaInput<T>;
}
