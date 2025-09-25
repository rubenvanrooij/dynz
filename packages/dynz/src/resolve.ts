import { resolveCondition } from "./conditions";
import {
  type ExtractRules,
  REFERENCE_TYPE,
  type Reference,
  type ResolvedRules,
  RuleType,
  type Schema,
  SchemaType,
  type ValueOrReference,
} from "./types";
import { isBoolean, isIterable, isNumber, isObject, isString } from "./validate";

export type ResolveContext = {
  schema: Schema;
  values: {
    new: unknown;
  };
};

/**
 * Returns all the dependencies for a specific path in a schema
 */
// export function getDependencies<T extends Schema>(schema: T, path: string): string[] {
//   const nested = findSchemaByPath(path, schema);

//   const property = nested.included

//   if(property !== undefined && !isBoolean(property)) {

//     const dependencies = property.type === 'or' || property.type === 'and'
//   }

//   const f = nested.included !== undefined && !isBoolean(nested.included)
// }

// function getConditionDependencies(condition: Condition, acc: string[] = []): string[] {

//   if(condition.type === 'and' || condition.type === 'or') {
//     return condition.conditions.reduce<string[]>((prev, cur) => [...prev, ...getConditionDependencies(cur, prev)],[])
//   }

//   return [condition.path]
// }

export function isRequired<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, "required", path, true, {
    schema,
    values: {
      new: values,
    },
  });
}

export function isIncluded<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, "included", path, true, {
    schema,
    values: {
      new: values,
    },
  });
}

export function isMutable<T extends Schema>(schema: T, path: string, values: unknown): boolean {
  const nested = getNested(path, schema, values);

  return resolveProperty(nested.schema, "mutable", path, true, {
    schema,
    values: {
      new: values,
    },
  });
}

/**
 * Resolves one of the following properties: required, mutable, included on a
 * schema
 */
export function resolveProperty<T extends Schema>(
  schema: T,
  property: "required" | "mutable" | "included",
  path: string,
  defaultValue: boolean,
  context: ResolveContext
): boolean {
  if (schema[property] === undefined) {
    return defaultValue;
  }

  return typeof schema[property] === "boolean" ? schema[property] : resolveCondition(schema[property], path, context);
}

export function resolveRules<T extends Schema>(
  schema: T,
  path: string,
  context: ResolveContext
): ResolvedRules<ExtractRules<T>>[] {
  return (schema.rules || [])
    .filter((rule) => (rule.type === RuleType.CONDITIONAL ? resolveCondition(rule.when, path, context) : true))
    .map((rule) => (rule.type === RuleType.CONDITIONAL ? rule.then : rule) as ResolvedRules<ExtractRules<T>>);
}

export function isReference(value: unknown): value is Reference {
  return typeof value === "object" && value !== null && "_type" in value && value._type === REFERENCE_TYPE;
}

export function unpackRefValue(valueOrRef: ValueOrReference, path: string, context: ResolveContext): unknown {
  return unpackRef(valueOrRef, path, context).value;
}

export function unpackRef(
  valueOrRef: ValueOrReference,
  path: string,
  context: ResolveContext
): { value: unknown; static: true } | { schema: Schema; value: unknown; static: false } {
  if (isReference(valueOrRef)) {
    const { schema, value } = getNested(ensureAbsolutePath(valueOrRef.path, path), context.schema, context.values.new);

    return {
      schema,
      value: "coerce" in schema && schema.coerce === true ? coerce(schema.type, value) : value,
      static: false,
    };
  }

  return { value: valueOrRef, static: true };
}

export function ensureAbsolutePath(fieldPath: string, path: string): string {
  if (fieldPath.startsWith("$")) {
    return fieldPath;
  }

  return `${getParent(path)}.${fieldPath}`;
}

function getParent(path: string): string {
  return path.split(".").slice(0, -1).join(".");
}

export function findSchemaByPath(path: string, schema: Schema): Schema;
export function findSchemaByPath<T extends Schema = Schema>(path: string, schema: Schema, type: T["type"]): T;
export function findSchemaByPath<T extends Schema = Schema>(path: string, schema: Schema, type?: T["type"]): Schema {
  const nestedSchema = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<Schema>((prev, cur) => {
      if (prev.type === SchemaType.ARRAY) {
        if (!isNumber(+cur)) {
          throw new Error(`Expected an array index at path ${path}, but got ${cur}`);
        }

        return prev.schema;
      }

      if (prev.type === SchemaType.OBJECT) {
        const childSchema = prev.fields[cur];

        if (childSchema === undefined) {
          throw new Error(`No schema found for path ${path}`);
        }

        return childSchema;
      }

      throw new Error(`Cannot find schema at path ${path}`);
    }, schema);

  if (type !== undefined && nestedSchema.type !== type) {
    throw new Error(`Expected schema of type ${type} at path ${path}, but got ${nestedSchema.type}`);
  }

  return nestedSchema;
}

export function getNested<T extends Schema>(
  path: string,
  schema: T,
  value: unknown
): { schema: Schema; value: unknown } {
  if (schema.private) {
    throw new Error(`Cannot access private schema at path ${path}`);
  }

  const result = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<{ schema: Schema; value: unknown }>(
      (acc, cur) => {
        if (acc.schema.type === SchemaType.ARRAY) {
          if (!Array.isArray(acc.value)) {
            throw new Error(`Expected an array at path ${path}, but got ${typeof acc.value}`);
          }

          const childSchema = acc.schema.schema;
          const index = +cur;
          const val = acc.value[index];

          if (childSchema.private === true) {
            throw new Error(`Cannot access private schema at path ${path}`);
          }

          return {
            value: val === undefined ? acc.schema.default : val,
            schema: acc.schema.schema,
          };
        }

        if (acc.schema.type === SchemaType.OBJECT) {
          if (acc.value !== undefined && !isObject(acc.value)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof acc.value}`);
          }

          const val = acc.value === undefined ? undefined : acc.value[cur];
          const childSchema = acc.schema.fields[cur];

          if (childSchema === undefined) {
            throw new Error(`No schema found for path ${path}`);
          }

          if (childSchema.private === true) {
            throw new Error(`Cannot access private schema at path ${path}`);
          }

          return {
            value: val === undefined ? acc.schema.fields[cur]?.default : val,
            schema: childSchema,
          };
        }

        throw new Error("Cannot get nested value on non array or non object");
      },
      { value, schema }
    );

  return {
    schema: result.schema,
    value:
      "coerce" in result.schema && result.schema.coerce === true
        ? coerce(result.schema.type, result.value)
        : result.value,
  };
}

/**
 * Function that tries to cast a value to the correct chema type:
 * e.g.:
 * "12" -> 12
 * or
 * true -> "true", 12 -> "12"
 */
export function coerce(type: SchemaType, value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  switch (type) {
    case SchemaType.DATE: {
      if (isNumber(value) || isString(value)) {
        return new Date(value);
      }
      return value;
    }
    case SchemaType.NUMBER: {
      if (!isNumber(value)) {
        return Number(value).valueOf();
      }

      return value;
    }
    case SchemaType.BOOLEAN:
      if (isBoolean(value)) {
        return value;
      }

      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return new Boolean(value).valueOf();
    case SchemaType.STRING: {
      if (isNumber(value) || isBoolean(value)) {
        return String(value).valueOf();
      }
      return value;
    }
    case SchemaType.ARRAY: {
      if (isIterable(value) || isString(value)) {
        return Array.from(value);
      }

      return value;
    }
    default:
      return value;
  }
}
