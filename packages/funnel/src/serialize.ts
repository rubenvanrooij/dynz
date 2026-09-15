import type { FunnelDefinition } from "./types";

export function serializeFunnel(funnel: FunnelDefinition): string {
  return JSON.stringify(funnel);
}
