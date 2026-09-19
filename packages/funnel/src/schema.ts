import { object, type Schema, SchemaType } from "dynz";
import type { FunnelDefinition } from "./types";

export type GetFunnelSchemaOptions = {
  /**
   * Step ids to keep required/included; every other step is marked `included: false`,
   * so it is neither required nor, with `{ stripNotIncludedValues: true }`, kept in a
   * validated result. Omit to include every step — the default this module needs for
   * predicate resolution, which must be able to see any step regardless of whether the
   * current values actually reach it. For validating a final submission, pass the ids
   * from `getFunnelPath(funnel, values)` instead: a skipped branch (e.g.
   * `travelDetails` for a non-travel claim) must not be required.
   */
  includedStepIds?: Iterable<string>;
  /**
   * Already-resolved schemas for steps whose own `schema` is a `schemaRef`, keyed by
   * step id. Substituted in place of the raw ref node wherever provided.
   *
   * This exists because `schemaRef` resolution inside dynz's `validate()` is async
   * (`ValidateOptions.resolveSchemaRef`) and only runs during that call — it cannot
   * help `resolveNextStep`/`isStepIncluded`/`getFunnelPath`, which resolve predicates
   * synchronously, outside of `validate()`. A step whose `next`/`included` predicate
   * needs to see its own (or another step's) fields needs that step's schema resolved
   * and passed here first; a step reached only via an *unconditional* transition never
   * needs to be.
   */
  resolvedSchemas?: Partial<Record<string, Schema>>;
};

/**
 * Derives a synthetic root schema (`{ [stepId]: step.schema, ... }`) purely so
 * funnel-level predicates (`next`/`included`) can be resolved with dynz's own
 * `resolvePredicate`, referencing any step's fields via `ref("$.<stepId>.<field>")`.
 * Step schemas stay independent and are validated independently via `validateStep`.
 */
export function getFunnelSchema(funnel: FunnelDefinition, options: GetFunnelSchemaOptions = {}): Schema {
  const included = options.includedStepIds === undefined ? undefined : new Set(options.includedStepIds);
  const fields: Record<string, Schema> = {};

  for (const s of funnel.steps) {
    const resolved = options.resolvedSchemas?.[s.id];
    const base = resolved !== undefined && s.schema.type === SchemaType.SCHEMA_REF ? resolved : s.schema;
    fields[s.id] = included === undefined || included.has(s.id) ? base : { ...base, included: false };
  }

  return object(fields);
}
