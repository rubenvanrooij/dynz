import type { Schema } from "dynz";
import { getFunnelPath } from "./resolve";
import type { FunnelDefinition, FunnelValues } from "./types";

export type FunnelProgress = {
  index: number;
  total: number;
  steps: string[];
};

/** See `getFunnelPath` for what `resolvedSchemas` must cover. */
export function getFunnelProgress(
  funnel: FunnelDefinition,
  currentStepId: string,
  values: FunnelValues,
  resolvedSchemas?: Partial<Record<string, Schema>>
): FunnelProgress {
  const steps = getFunnelPath(funnel, values, resolvedSchemas);

  return {
    index: steps.indexOf(currentStepId),
    total: steps.length,
    steps,
  };
}
