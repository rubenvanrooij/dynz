import { type Schema, SchemaType } from "../types";
import { ensureAbsolutePath } from "../utils";
import { type Condition, ConditionType } from "./types";

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

export function getSchemaDependencies(schema: Schema, path: string): string[] {
  return schema.rules
    ? schema.rules.reduce<string[]>((acc, cur) => {
        if (cur.type === "conditional") {
          acc.push(...getConditionDependencies(cur.when, path));
        }
        return acc;
      }, [])
    : [];
}

export function getDependenciesMap(schema: Schema, path: string = "$"): Record<string, string[]> {
  const dependencies = getSchemaDependencies(schema, path);
  switch (schema.type) {
    case SchemaType.ARRAY: {
      const arraySchemaDependences = getSchemaDependencies(schema.schema, `${path}.[]`);
      return {
        ...(dependencies.length > 0 ? { [path]: dependencies } : {}),
        ...(arraySchemaDependences.length > 0
          ? { [`${path}.[]`]: getSchemaDependencies(schema.schema, `${path}.[]`) }
          : {}),
      };
    }
    case SchemaType.OBJECT:
      return Object.entries(schema.fields).reduce<Record<string, string[]>>(
        (acc, [key, schema]) => {
          return {
            ...acc,
            ...getDependenciesMap(schema, `${path}.${key}`),
          };
        },
        dependencies.length > 0 ? { [path]: dependencies } : {}
      );
    default:
      return dependencies.length > 0 ? { [path]: dependencies } : {};
  }
}
