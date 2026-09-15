import type { Predicate, Schema, SchemaMeta } from "dynz";
import type { FunnelDefinition, FunnelStep, FunnelTransition } from "./types";

export function transition(to: string | null, when?: Predicate): FunnelTransition {
  return when === undefined ? { to } : { to, when };
}

export function step<T extends Schema>(
  id: string,
  schema: T,
  options: {
    next: FunnelTransition[];
    included?: boolean | Predicate;
    meta?: SchemaMeta;
  }
): FunnelStep<T> {
  return {
    id,
    schema,
    next: options.next,
    ...(options.included !== undefined ? { included: options.included } : {}),
    ...(options.meta !== undefined ? { meta: options.meta } : {}),
  };
}

export function defineFunnel<T extends FunnelStep[]>(config: { initial: string; steps: T }): FunnelDefinition<T> {
  const ids = new Set<string>();

  for (const s of config.steps) {
    if (ids.has(s.id)) {
      throw new Error(`dynz-funnel: duplicate step id "${s.id}"`);
    }
    ids.add(s.id);
  }

  if (!ids.has(config.initial)) {
    throw new Error(`dynz-funnel: initial step "${config.initial}" is not a defined step`);
  }

  for (const s of config.steps) {
    for (const t of s.next) {
      if (t.to !== null && !ids.has(t.to)) {
        throw new Error(`dynz-funnel: step "${s.id}" has a transition to unknown step "${t.to}"`);
      }
    }
  }

  return { type: "funnel", initial: config.initial, steps: config.steps };
}
