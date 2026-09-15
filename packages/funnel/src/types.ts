import type { Predicate, Schema, SchemaMeta } from "dynz";

export type FunnelTransition = {
  /** Omit for an unconditional fallback — must be the last entry in `next`. */
  when?: Predicate;
  /** Target step id, or null to end the funnel. */
  to: string | null;
};

export type FunnelStep<TSchema extends Schema = Schema> = {
  id: string;
  schema: TSchema;
  /**
   * Extra gate on top of the step's own field-level `included` predicates —
   * for "skip this entire step" logic that doesn't map onto a single field.
   * Defaults to `true`.
   */
  included?: boolean | Predicate;
  /** Evaluated top-to-bottom; the first matching (or unconditional) entry wins. */
  next: FunnelTransition[];
  meta?: SchemaMeta;
};

export type FunnelDefinition<TSteps extends FunnelStep[] = FunnelStep[]> = {
  type: "funnel";
  initial: string;
  steps: TSteps;
};

/** Accumulated values, namespaced by step id. */
export type FunnelValues = Record<string, unknown>;
