import { resolvePredicate } from "../functions";
import type { ExtractRules, ResolveContext, ResolvedRules, Schema } from "../types";

export function resolveRules<T extends Schema>(
  schema: T,
  path: string,
  context: ResolveContext
): ResolvedRules<T, ExtractRules<T>>[] {
  return (schema.rules || [])
    .filter((rule) => (rule.type === "conditional" ? resolvePredicate(rule.when, path, context) : true))
    .map((rule) => (rule.type === "conditional" ? rule.then : rule) as ResolvedRules<T, ExtractRules<T>>);
}
