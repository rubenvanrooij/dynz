import type { ParamaterValue, Predicate, Transformer } from "../functions";
import { isReference } from "../reference";
import type { Rule } from "../rules";
import { type Schema, SchemaType } from "../types";
import { ensureAbsolutePath, findSchemaByPath } from "../utils";
import type { RulesDependencyMap } from "./types";

/**
 * Returns all the dependencies for a given condition
 * @param condition
 * @param path
 * @returns
 */

export function getConditionDependencies(input: Predicate | Transformer, path: string, schema: Schema): string[] {
  switch (input.type) {
    case "and":
    case "or":
      return input.predicates.reduce<string[]>((acc, cur) => {
        acc.push(...getConditionDependencies(cur, path, schema));
        return acc;
      }, []);
    case "eq":
    case "neq":
    case "in":
    case "nin":
    case "gt":
    case "gte":
    case "lt":
    case "lte":
    case "matches":
      return [
        ...getParamaterDependencies(input.left, path, schema),
        ...getParamaterDependencies(input.right, path, schema),
      ];
    case "ceil":
    case "cos":
    case "floor":
    case "sin":
    case "tan":
    case "size":
    case "age":
    case "lookup":
      return getParamaterDependencies(input.value, path, schema);
    case "sum":
    case "sub":
    case "multiply":
    case "divide":
    case "min":
    case "max":
      return input.value.reduce<string[]>((acc, cur) => {
        acc.push(...getParamaterDependencies(cur, path, schema));
        return acc;
      }, []);
  }
}

export function getParamaterDependencies(param: ParamaterValue, path: string, schema: Schema): string[] {
  if (isReference(param)) {
    const referencePath = ensureAbsolutePath(param.path, path);

    const inner = findSchemaByPath(referencePath, schema);

    if (inner.included !== undefined && typeof inner.included !== "boolean") {
      return [referencePath, ...getConditionDependencies(inner.included, referencePath, schema)];
    }

    return [referencePath];
  }

  if (param === undefined || param.type === "st") {
    return [];
  }

  return getConditionDependencies(param, path, schema);
}

function getRuleDependencies(rule: Rule, path: string, schema: Schema): string[] {
  if (rule.type === "conditional") {
    return rule.cases.reduce<string[]>((acc, cur) => {
      acc.push(...getConditionDependencies(cur.when, path, schema), ...getRuleDependencies(cur.then, path, schema));
      return acc;
    }, []);
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
        acc.push(...getRuleDependencies(cur, path, schema));
        return acc;
      }, [])
    : [];
}

function _getRulesDependenciesMap(schema: Schema, path: string, root: Schema): RulesDependencyMap {
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

  addDependencies(path, getRulesDependencies(root, path));

  switch (schema.type) {
    case SchemaType.ARRAY: {
      // TODO: Find out if we should just ditch the [] and mark the fields dependent on the array itself?
      const arrayPath = `${path}.[]`;
      addDependencies(arrayPath, getRulesDependencies(root, arrayPath));
      break;
    }
    case SchemaType.OBJECT: {
      for (const [fieldKey, fieldSchema] of Object.entries(schema.fields)) {
        const childDependencies = _getRulesDependenciesMap(fieldSchema, `${path}.${fieldKey}`, root);
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

/**
 * Returns all the rule dependenceis on other fields for a givens chema
 * @param schema
 * @param path
 * @returns
 */
export function getRulesDependenciesMap(schema: Schema, path: string = "$"): RulesDependencyMap {
  return _getRulesDependenciesMap(schema, path, schema);
}
