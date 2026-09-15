import { object, type Schema } from "dynz";
import type { FunnelDefinition } from "./types";

/**
 * Derives a synthetic root schema (`{ [stepId]: step.schema, ... }`) purely so
 * funnel-level predicates (`next`/`included`) can be resolved with dynz's own
 * `resolvePredicate`, referencing any step's fields via `ref("$.<stepId>.<field>")`.
 * Step schemas stay independent and are validated independently via `validateStep`.
 *
 * Every field defaults to required, so calling this with no `includedStepIds` treats
 * *every* step as mandatory — correct for predicate resolution (which must be able to
 * see any step regardless of whether the current values actually reach it), wrong for
 * validating a final submission (a skipped branch, e.g. `travelDetails` for a non-travel
 * claim, must not be required). For that, pass the ids from `getFunnelPath(funnel,
 * values)`: every other step is then marked `included: false`, so it is neither
 * required nor, with `{ stripNotIncludedValues: true }`, kept in the validated output.
 */
export function getFunnelSchema(funnel: FunnelDefinition, includedStepIds?: Iterable<string>): Schema {
  const included = includedStepIds === undefined ? undefined : new Set(includedStepIds);
  const fields: Record<string, Schema> = {};

  for (const s of funnel.steps) {
    fields[s.id] = included === undefined || included.has(s.id) ? s.schema : { ...s.schema, included: false };
  }

  return object(fields);
}
