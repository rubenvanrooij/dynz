import { resolvePredicate } from "../functions";
import type { ResolveContext, ResolvedRules, Schema } from "../types";

export function resolveRules<T extends Schema>(schema: T, path: string, context: ResolveContext): ResolvedRules[] {
  return (schema.rules || []).reduce<ResolvedRules[]>((acc, rule) => {
    if (rule.type === "conditional") {
      const found = rule.cases.find(({ when }) => resolvePredicate(when, path, context));

      if (found === undefined) {
        // dont add any rules if no conditions are met
        return acc;
      }

      acc.push(found.then);
    } else {
      acc.push(rule);
    }

    return acc;
  }, []);
}
