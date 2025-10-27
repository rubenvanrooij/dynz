import { type Schema, SchemaType } from "../types";
import { ensureAbsolutePath } from "../utils";
import { type Condition, ConditionType } from "./types";

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

function getRulesDependencies(schema: Schema, path: string): string[] {
  return schema.rules
    ? schema.rules.reduce<string[]>((acc, cur) => {
        if (cur.type === "conditional") {
          acc.push(...getConditionDependencies(cur.when, path));
        }
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
export function getRulesDependenciesMap(schema: Schema, path: string = "$"): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const addDependencies = (path: string, deps: string[]) => {
    if (deps.length > 0) {
      result[path] = deps;
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
        Object.assign(result, childDependencies);
      }
      break;
    }
  }

  return result;
}
