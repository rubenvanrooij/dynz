import type { Schema, SchemaInput, SchemaValues } from "../types";
import { getMaskName } from "./is-private";
import type { MaskedPrivateValue } from "./types";
import { walkPrivateLeaves } from "./walk-private-leaves";

export type Masker = (value: unknown) => string;
export type MaskerMap = Record<string, Masker>;

export type MaskPrivateValuesOptions = {
  /** Named maskers, referenced from a schema via `setPrivate({ mask: name })`. */
  maskers?: MaskerMap | undefined;
};

export const DEFAULT_MASK = "***";

/**
 * Masks every private field of a stored document, producing the payload that is safe to
 * send to a client. A field with no value stays empty, so the client can tell "nothing
 * stored" apart from "stored but hidden".
 *
 * ```ts
 * const schema = object({ iban: string().setPrivate({ mask: "last4" }) });
 *
 * maskPrivateValues(schema, stored, {
 *   maskers: { last4: (value) => `****${String(value).slice(-4)}` },
 * });
 * // { iban: { state: "masked", value: "****4300" } }
 * ```
 *
 * Throws when a schema names a masker that was not supplied.
 */
export function maskPrivateValues<T extends Schema>(
  schema: T,
  values: SchemaValues<T>,
  options: MaskPrivateValuesOptions = {}
): SchemaInput<T> {
  return walkPrivateLeaves<never>(schema, values, "$", (value, path, leafSchema) => {
    if (value === undefined || value === null) {
      return { value, marks: [] };
    }

    const name = getMaskName(leafSchema);
    const masker = name === undefined ? undefined : options.maskers?.[name];

    if (name !== undefined && masker === undefined) {
      throw new Error(`No masker named "${name}" was supplied for private field ${path}`);
    }

    const masked: MaskedPrivateValue = { state: "masked", value: masker ? masker(value) : DEFAULT_MASK };
    return { value: masked, marks: [] };
  }).value as SchemaInput<T>;
}
