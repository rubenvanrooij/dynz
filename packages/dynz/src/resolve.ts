import {
  type Condition,
  ConditionType,
  type EqualsCondition,
  type GreaterThanCondition,
  type GreaterThanOrEqualCondition,
  type LowerThanCondition,
  type LowerThanOrEqualCondition,
  type NotEqualsCondition,
  type Reference,
  type ResolvedRules,
  RuleType,
  type Schema,
  SchemaType,
  type ValueOrRef,
  type ValueType,
} from "./types";
import {
  assertArray,
  isBoolean,
  isIterable,
  isNumber,
  isObject,
  isString,
  parseDateString,
  validateSchema,
} from "./validate";

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
) {
  if (schema[property] === undefined) {
    return defaultValue;
  }

  return typeof schema[property] === "boolean" ? schema[property] : resolveCondition(schema[property], path, context);
}

export function resolveCondition(condition: Condition, path: string, context: ResolveContext): boolean {
  switch (condition.type) {
    case ConditionType.AND:
      return condition.conditions.every((condition) => resolveCondition(condition, path, context));
    case ConditionType.OR:
      return condition.conditions.some((condition) => resolveCondition(condition, path, context));
    case ConditionType.EQUALS:
    case ConditionType.NOT_EQUALS:
    case ConditionType.GREATHER_THAN:
    case ConditionType.GREATHER_THAN_OR_EQUAL:
    case ConditionType.LOWER_THAN:
    case ConditionType.LOWER_THAN_OR_EQUAL:
      return validateWithOperator(condition, path, context);
    case ConditionType.MATCHES: {
      const left = getNestedValue(ensureAbsolutePath(condition.path, path), context.schema, context.values.new);

      if (!isString(left)) {
        throw new Error(
          `Condition ${condition.type} expects a string value at path ${condition.path}, but got ${typeof left}`
        );
      }

      return new RegExp(condition.value).test(left);
    }
    case ConditionType.IS_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return assertArray(right).includes(left);
    }
    case ConditionType.IS_NOT_IN: {
      const { left, right } = getConditionOperands(condition, path, context);
      return !assertArray(right).includes(left);
    }
  }
}

const OPERATORS = {
  [ConditionType.EQUALS]: (a: ValueType, b: ValueType) => {
    return a === b;
  },
  [ConditionType.NOT_EQUALS]: (a: ValueType, b: ValueType) => a === b,
  [ConditionType.GREATHER_THAN]: (a: ValueType, b: ValueType) => a > b,
  [ConditionType.GREATHER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) => a >= b,
  [ConditionType.LOWER_THAN]: (a: ValueType, b: ValueType) => a < b,
  [ConditionType.LOWER_THAN_OR_EQUAL]: (a: ValueType, b: ValueType) => a <= b,
} as const;

function validateWithOperator(
  condition:
    | EqualsCondition
    | NotEqualsCondition
    | GreaterThanCondition
    | LowerThanCondition
    | GreaterThanOrEqualCondition
    | LowerThanOrEqualCondition,
  path: string,
  context: ResolveContext
): boolean {
  const { left, right } = getConditionOperands(condition, path, context);

  // Both operands must be defined for comparison
  if (left === undefined || right === undefined) {
    return false;
  }

  return OPERATORS[condition.type](left, right);
}

/**
 * Converts a value to a comparable type based on the schema.
 * For date strings, converts to milliseconds for proper comparison.                                                                                                                                                                 
│* For other types, returns the value unchanged.
 */
function toCompareType<T extends Schema>(schema: T, value: ValueType): ValueType | number {
  if (schema.type === SchemaType.DATE_STRING) {
    return parseDateString(`${value}`, schema.format).getTime();
  }

  return value;
}

/**
 * Returns the condition operands for a specific condition and validates whether the type of the value is correct
 * for a referenced value it is using the referenced schema type; for a static value it is using the schema type of
 * the validated schema itself. When the value does not comply with the schema type, it returns undefined.
 *
 * @param condition
 * @param path
 * @param context
 * @returns
 */
function getConditionOperands<T extends ValueType>(
  condition: { path: string; value: ValueOrRef<T> | ValueOrRef<T>[] },
  path: string,
  context: ResolveContext
): { left?: ValueType | undefined; right?: ValueType | undefined } {
  const nested = getNested(ensureAbsolutePath(condition.path, path), context.schema, context.values.new);

  const left = validateSchema(nested.schema, nested.value) ? toCompareType(nested.schema, nested.value) : undefined;

  if (Array.isArray(condition.value)) {
    return {
      left,
      right: condition.value.map((val) => {
        // TODO: Fix this!
        const unpacked = unpackRef(val as ValueType, path, context);

        if (unpacked.static) {
          // TODO: Add dev check to ensure value is of type ValueType
          return validateSchema(nested.schema, unpacked.value as ValueType)
            ? toCompareType(nested.schema, unpacked.value as ValueType)
            : undefined;
        }

        return validateSchema(unpacked.schema, unpacked.value)
          ? toCompareType(unpacked.schema, unpacked.value)
          : undefined;
      }),
    };
  }

  const unpacked = unpackRef(condition.value, path, context);

  if (unpacked.static) {
    return {
      left: left,
      // TODO: Add dev check to ensure value is of type ValueType
      right: validateSchema(nested.schema, unpacked.value as ValueType)
        ? toCompareType(nested.schema, unpacked.value as ValueType)
        : undefined,
    };
  }

  return {
    left: left,
    right: validateSchema(unpacked.schema, unpacked.value) ? toCompareType(unpacked.schema, unpacked.value) : undefined,
  };
}

export function resolveRules(schema: Schema, path: string, context: ResolveContext): ResolvedRules[] {
  return (schema.rules || [])
    .filter((rule) => (rule.type === RuleType.CONDITIONAL ? resolveCondition(rule.when, path, context) : true))
    .map((rule): ResolvedRules => (rule.type === RuleType.CONDITIONAL ? rule.then : rule));
}

export function isReference(value: unknown): value is Reference {
  return typeof value === "object" && value !== null && "type" in value && value.type === "__reference";
}

export function unpackRefValue(valueOrRef: ValueOrRef, path: string, context: ResolveContext): unknown {
  return unpackRef(valueOrRef, path, context).value;
}

export function unpackRef(
  valueOrRef: ValueOrRef,
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

function ensureAbsolutePath(fieldPath: string, path: string): string {
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

export function getNested<T extends Schema>(path: string, schema: T, value: unknown) {
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

function getNestedValue<T extends Schema>(path: string, schema: T, value: unknown): unknown {
  return getNested(path, schema, value).value;
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
      return Number(value);
    }
    case SchemaType.BOOLEAN:
      if (value === "true") {
        return true;
      }

      if (value === "false") {
        return false;
      }

      return new Boolean(value);
    case SchemaType.STRING: {
      if (isNumber(value) || isBoolean(value)) {
        return String(value);
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
