import { isReference } from "../reference";
import { type Rule, type Schema, SchemaType } from "../types";
import { ensureAbsolutePath } from "../utils";
import { type Condition, ConditionType, type RulesDependencyMap } from "./types";

/**
 * Returns all the dependencies for a given condition
 * @param condition
 * @param path
 * @returns
 */
export function getConditionDependencies(condition: Condition, path: string): string[] {
  switch (condition.type) {
    case ConditionType.AND:
    case ConditionType.OR:
      return condition.conditions.reduce<string[]>((acc, cur) => {
        acc.push(...getConditionDependencies(cur, path));
        return acc;
      }, []);
    default:
      return [ensureAbsolutePath(condition.path, path)];
  }
}

function getRuleDependencies(rule: Rule, path: string): string[] {
  if (rule.type === "conditional") {
    return [...getConditionDependencies(rule.when, path), ...getRuleDependencies(rule.then, path)];
  }

  if (rule.type === "custom") {
    return Object.values(rule.params)
      .filter((v) => isReference(v))
      .map((v) => ensureAbsolutePath(v.path, path));
  }

  if (rule.type === "one_of") {
    return rule.values.filter((v) => isReference(v)).map((v) => ensureAbsolutePath(v.path, path));
  }

  // Handle other rules with references in their properties
  return Object.values(rule)
    .filter((v) => isReference(v))
    .map((v) => ensureAbsolutePath(v.path, path));
}

export function getRulesDependencies(schema: Schema, path: string): string[] {
  return schema.rules
    ? schema.rules.reduce<string[]>((acc, cur) => {
        acc.push(...getRuleDependencies(cur, path));
        return acc;
      }, [])
    : [];
}

/**
 * Returns all the rule dependenceis on other fields for a givens chema
 * @param schema
 * @param path
 * @returns
 */
export function getRulesDependenciesMap(schema: Schema, path: string = "$"): RulesDependencyMap {
  const result: RulesDependencyMap = {
    dependencies: {},
    reverse: {},
  };
  const addDependencies = (path: string, deps: string[]) => {
    if (deps.length > 0) {
      result.dependencies[path] = new Set(deps);
    }

    for (const dep of deps) {
      if (!result.reverse[dep]) {
        result.reverse[dep] = new Set();
      }
      result.reverse[dep].add(path);
    }
  };

  addDependencies(path, getRulesDependencies(schema, path));

  switch (schema.type) {
    case SchemaType.ARRAY: {
      // TODO: Find out if we should just ditch the [] and mark the fields dependent on the array itself?
      const arrayPath = `${path}.[]`;
      addDependencies(arrayPath, getRulesDependencies(schema.schema, arrayPath));
      break;
    }
    case SchemaType.OBJECT: {
      for (const [fieldKey, fieldSchema] of Object.entries(schema.fields)) {
        const childDependencies = getRulesDependenciesMap(fieldSchema, `${path}.${fieldKey}`);
        // Merge dependencies
        Object.assign(result.dependencies, childDependencies.dependencies);
        // Merge reverse dependencies
        for (const [dep, dependents] of Object.entries(childDependencies.reverse)) {
          if (!result.reverse[dep]) {
            result.reverse[dep] = new Set();
          }
          for (const dependent of dependents) {
            result.reverse[dep].add(dependent);
          }
        }
      }
      break;
    }
  }

  return result;
}
