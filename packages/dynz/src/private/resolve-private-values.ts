import type { Schema } from "../types";
import { isObject } from "../validate/validate-type";
import { isPrivateValue } from "./is-private";
import type { MaskedPrivateValue } from "./types";
import { walkPrivateLeaves } from "./walk-private-leaves";

/**
 * What `resolvePrivateValues` could not turn into a plain value:
 * - `masked`: an untouched field with no stored value to substitute (client side, or
 *   the stored value is itself masked). Validation skips it and passes the marker on.
 * - `missing`: a masked value was submitted but nothing is stored at that path, so
 *   there is nothing it could stand in for.
 */
export type PrivateMark =
  | { kind: "masked"; path: string; marker: MaskedPrivateValue }
  | { kind: "missing"; path: string };

export type ResolvedPrivateValues = {
  current: unknown;
  next: unknown;
  marks: PrivateMark[];
};

/**
 * Turns the current and new documents into plain documents before validation, so every
 * reader downstream (rules, `ref()`, conditions, mutability) sees real values:
 *
 * - `plain(x)` and a raw `x` both become `x`.
 * - A masked value becomes the stored plain value at the same path, so an untouched
 *   field validates as unchanged and the output is ready to persist.
 * - A masked value with nothing to substitute is reported as a {@link PrivateMark}.
 *
 * @param hasCurrent whether current values were passed at all (server mode)
 */
export function resolvePrivateValues(
  schema: Schema,
  current: unknown,
  next: unknown,
  hasCurrent: boolean
): ResolvedPrivateValues {
  const resolvedCurrent = walkPrivateLeaves<string>(schema, current, "$", (value, path) => {
    if (!isPrivateValue(value)) {
      return { value, marks: [] };
    }

    // A masked current value means the caller only holds the masked payload (client
    // side); the real value is unknown.
    return value.state === "masked" ? { value: undefined, marks: [path] } : { value: value.value, marks: [] };
  });

  const resolvedNext = walkPrivateLeaves<PrivateMark>(schema, next, "$", (value, path) => {
    if (!isPrivateValue(value)) {
      return { value, marks: [] };
    }

    if (value.state === "plain") {
      return { value: value.value, marks: [] };
    }

    const stored = getAtPath(resolvedCurrent.value, path);

    if (stored !== undefined && stored !== null) {
      return { value: stored, marks: [] };
    }

    if (hasCurrent && !resolvedCurrent.marks.includes(path)) {
      return { value: undefined, marks: [{ kind: "missing", path }] };
    }

    return { value: undefined, marks: [{ kind: "masked", path, marker: { state: "masked", value: value.value } }] };
  });

  return { current: resolvedCurrent.value, next: resolvedNext.value, marks: resolvedNext.marks };
}

/** Reads a plain value at a `validate`-style path (`$.tags.[1].name`). */
function getAtPath(value: unknown, path: string): unknown {
  return path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<unknown>((acc, segment) => {
      if (Array.isArray(acc)) {
        return acc[Number(segment)];
      }

      return isObject(acc) ? acc[segment] : undefined;
    }, value);
}
