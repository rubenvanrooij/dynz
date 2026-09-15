import { getFunnelPath } from "./resolve";
import type { FunnelDefinition, FunnelValues } from "./types";

export type FunnelProgress = {
  index: number;
  total: number;
  steps: string[];
};

export function getFunnelProgress(
  funnel: FunnelDefinition,
  currentStepId: string,
  values: FunnelValues
): FunnelProgress {
  const steps = getFunnelPath(funnel, values);

  return {
    index: steps.indexOf(currentStepId),
    total: steps.length,
    steps,
  };
}
