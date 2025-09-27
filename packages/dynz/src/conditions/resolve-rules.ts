import type { ExtractRules, ResolveContext, ResolvedRules, Schema } from "../types";
import { resolveCondition } from "./resolve-condition";

export function resolveRules<T extends Schema>(
  schema: T,
  path: string,
  context: ResolveContext
): ResolvedRules<T, ExtractRules<T>>[] {
  return (schema.rules || [])
    .filter((rule) => (rule.type === "conditional" ? resolveCondition(rule.when, path, context) : true))
    .map((rule) => (rule.type === "conditional" ? rule.then : rule) as ResolvedRules<T, ExtractRules<T>>);
}
