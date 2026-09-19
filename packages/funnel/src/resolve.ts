import { type ResolveContext, resolvePredicate, type Schema } from "dynz";
import { getFunnelSchema } from "./schema";
import type { FunnelDefinition, FunnelStep, FunnelValues } from "./types";

function getStep(funnel: FunnelDefinition, stepId: string): FunnelStep {
  const step = funnel.steps.find((s) => s.id === stepId);

  if (step === undefined) {
    throw new Error(`dynz-funnel: unknown step "${stepId}"`);
  }

  return step;
}

function getResolveContext(
  funnel: FunnelDefinition,
  values: FunnelValues,
  resolvedSchemas: Partial<Record<string, Schema>> | undefined
): ResolveContext {
  return {
    schema: getFunnelSchema(funnel, resolvedSchemas === undefined ? {} : { resolvedSchemas }),
    values,
  };
}

/**
 * `resolvedSchemas` is only needed when a step's own `schema` is a `schemaRef` *and*
 * its `next`/`included` predicates reach into a step whose schema hasn't been resolved
 * yet — most commonly the step being left itself (`ref("$.<thisStepId>.<field>")`), by
 * definition already resolved by the time its own transitions are evaluated. See
 * `getFunnelSchema`'s `resolvedSchemas` option for why this can't happen automatically.
 */
export function resolveNextStep(
  funnel: FunnelDefinition,
  currentStepId: string,
  values: FunnelValues,
  resolvedSchemas?: Partial<Record<string, Schema>>
): string | null {
  const step = getStep(funnel, currentStepId);
  const context = getResolveContext(funnel, values, resolvedSchemas);

  for (const t of step.next) {
    if (t.when === undefined || resolvePredicate(t.when, "$", context) === true) {
      return t.to;
    }
  }

  return null;
}

export function isStepIncluded(
  funnel: FunnelDefinition,
  stepId: string,
  values: FunnelValues,
  resolvedSchemas?: Partial<Record<string, Schema>>
): boolean {
  const step = getStep(funnel, stepId);

  if (step.included === undefined || typeof step.included === "boolean") {
    return step.included ?? true;
  }

  return resolvePredicate(step.included, "$", getResolveContext(funnel, values, resolvedSchemas)) ?? true;
}

/**
 * Walks from `funnel.initial`, following `resolveNextStep` given the current values,
 * and returns the ordered list of step ids actually reachable. Useful for progress
 * indicators / step lists. Guards against a definition bug that would loop with the
 * same values (single-hop `resolveNextStep` is O(1) and needs no such guard).
 *
 * Every step this walk passes through must have a resolved schema available (in
 * `resolvedSchemas`, for any that are `schemaRef`s) if its transitions need it — a
 * caller that hasn't resolved a step yet (e.g. one it hasn't reached in a lazily-loaded
 * wizard) should not call this for a path that goes beyond what it already has.
 */
export function getFunnelPath(
  funnel: FunnelDefinition,
  values: FunnelValues,
  resolvedSchemas?: Partial<Record<string, Schema>>
): string[] {
  const visited = new Set<string>();
  const path: string[] = [];
  let current: string | null = funnel.initial;

  while (current !== null && !visited.has(current)) {
    visited.add(current);
    path.push(current);
    current = resolveNextStep(funnel, current, values, resolvedSchemas);
  }

  return path;
}
