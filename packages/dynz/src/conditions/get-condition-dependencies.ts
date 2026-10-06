import type { ParamaterValue, Predicate, Transformer } from "../functions";
import { isReference } from "../reference";
import type { Rule } from "../rules";
import { type Schema, SchemaType } from "../types";
import { ensureAbsolutePath, findPossibleSchemasByPath } from "../utils";
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
    case "same_calendar":
    case "date_diff":
      return [
        ...getParamaterDependencies(input.left, path, schema),
        ...getParamaterDependencies(input.right, path, schema),
      ];
    case "ceil":
    case "atan":
    case "cos":
    case "floor":
    case "sin":
    case "tan":
    case "size":
    case "age":
    case "start_of":
    case "end_of":
    case "is_boundary_day":
      return getParamaterDependencies(input.value, path, schema);
    case "lookup":
      return [
        ...getParamaterDependencies(input.value, path, schema),
        ...getParamaterDependencies(input.lookup, path, schema),
      ];
    case "date_add":
      return [
        ...getParamaterDependencies(input.value, path, schema),
        ...getParamaterDependencies(input.amount, path, schema),
      ];
    case "pluck":
      return getParamaterDependencies(input.array, path, schema);
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

    const dependencies = findPossibleSchemasByPath(referencePath, schema).reduce<string[]>((acc, inner) => {
      if (inner.included !== undefined && typeof inner.included !== "boolean") {
        acc.push(...getConditionDependencies(inner.included, referencePath, schema));
      }

      return acc;
    }, []);

    return [...new Set([referencePath, ...dependencies])];
  }

  if (param === undefined || param.type === "st") {
    return [];
  }

  return getConditionDependencies(param, path, schema);
}

// Structural check (no lookup in the function registries: importing those here creates an import cycle)
function isFunction(value: unknown): value is Predicate | Transformer {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    typeof value.type === "string" &&
    value.type !== "st" &&
    !isReference(value)
  );
}

/**
 * Dependencies of a single rule parameter: the referenced path itself, or every
 * reference nested inside a predicate/transformer (e.g. `after(dateAdd(ref("start"), 3, "month"))`).
 */
function getRuleParamaterDependencies(param: unknown, path: string, schema: Schema): string[] {
  if (isReference(param)) {
    return [ensureAbsolutePath(param.path, path)];
  }

  return isFunction(param) ? (getConditionDependencies(param, path, schema) ?? []) : [];
}

function getRuleDependencies(rule: Rule, path: string, schema: Schema): string[] {
  switch (rule.type) {
    case "conditional":
      return rule.cases.flatMap((cur) => [
        ...getConditionDependencies(cur.when, path, schema),
        ...getRuleDependencies(cur.then, path, schema),
      ]);
    case "satisfies":
      return getConditionDependencies(rule.predicate, path, schema);
    case "custom":
      return Object.values(rule.params).flatMap((param) => getRuleParamaterDependencies(param, path, schema));
    default:
      // Any other rule: references/functions are direct properties, or array entries (one_of, not_one_of)
      return Object.values(rule)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .flatMap((param) => getRuleParamaterDependencies(param, path, schema));
  }
}

/**
 * Returns the fields the rules of the schema at `path` depend on.
 *
 * @param schema - The root schema (references are resolved against it)
 * @param path - Path of the field whose rules to inspect, e.g. `$.startDate` or `startDate`
 */
export function getRulesDependencies(schema: Schema, path: string): string[] {
  const absolutePath = ensureAbsolutePath(path, "$");
  // `[]` denotes "any array item" (see getRulesDependenciesMap); look up the item schema via index 0
  const fields = findPossibleSchemasByPath(absolutePath.replaceAll("[]", "0"), schema);

  const dependencies = fields
    .flatMap((field) => field.rules ?? [])
    .flatMap((rule) => getRuleDependencies(rule, absolutePath, schema))
    // a field referencing its own value (e.g. `satisfies(isFirstDayOf(ref("startDate"), "month"))`) is not a dependency
    .filter((dep) => dep !== absolutePath);

  return [...new Set(dependencies)];
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
    case SchemaType.DISCRIMINATED_UNION: {
      for (const member of schema.schemas) {
        for (const [fieldKey, fieldSchema] of Object.entries(member)) {
          if (typeof fieldSchema === "string" || typeof fieldSchema === "number" || typeof fieldSchema === "boolean") {
            continue;
          }

          // add discriminated union key as a dependency
          addDependencies(`${path}.${schema.key}`, [`${path}.${fieldKey}`]);

          const childDependencies = _getRulesDependenciesMap(fieldSchema, `${path}.${fieldKey}`, root);
          Object.assign(result.dependencies, childDependencies.dependencies);
          for (const [dep, dependents] of Object.entries(childDependencies.reverse)) {
            if (!result.reverse[dep]) {
              result.reverse[dep] = new Set();
            }
            for (const dependent of dependents) {
              result.reverse[dep].add(dependent);
            }
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
