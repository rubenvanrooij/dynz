import { resolvePredicate, type ResolveContext } from "dynz";
import { getFunnelSchema } from "./schema";
import type { FunnelDefinition, FunnelStep, FunnelValues } from "./types";

function getStep(funnel: FunnelDefinition, stepId: string): FunnelStep {
  const step = funnel.steps.find((s) => s.id === stepId);

  if (step === undefined) {
    throw new Error(`dynz-funnel: unknown step "${stepId}"`);
  }

  return step;
}

function getResolveContext(funnel: FunnelDefinition, values: FunnelValues): ResolveContext {
  return { schema: getFunnelSchema(funnel), values };
}

export function resolveNextStep(funnel: FunnelDefinition, currentStepId: string, values: FunnelValues): string | null {
  const step = getStep(funnel, currentStepId);
  const context = getResolveContext(funnel, values);

  for (const t of step.next) {
    if (t.when === undefined || resolvePredicate(t.when, "$", context) === true) {
      return t.to;
    }
  }

  return null;
}

export function isStepIncluded(funnel: FunnelDefinition, stepId: string, values: FunnelValues): boolean {
  const step = getStep(funnel, stepId);

  if (step.included === undefined || typeof step.included === "boolean") {
    return step.included ?? true;
  }

  return resolvePredicate(step.included, "$", getResolveContext(funnel, values)) ?? true;
}

/**
 * Walks from `funnel.initial`, following `resolveNextStep` given the current
 * values, and returns the ordered list of step ids actually reachable. Useful
 * for progress indicators / step lists. Guards against a definition bug that
 * would loop with the same values (single-hop `resolveNextStep` is O(1) and
 * needs no such guard).
 */
export function getFunnelPath(funnel: FunnelDefinition, values: FunnelValues): string[] {
  const visited = new Set<string>();
  const path: string[] = [];
  let current: string | null = funnel.initial;

  while (current !== null && !visited.has(current)) {
    visited.add(current);
    path.push(current);
    current = resolveNextStep(funnel, current, values);
  }

  return path;
}
