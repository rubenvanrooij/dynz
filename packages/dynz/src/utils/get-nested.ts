import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate/validate-type";
import { coerceSchema } from "./coerce";
import { withDefault } from "./with-default";

type Accumulator = { schema: Schema; value: unknown } | null;

export function getNested<T extends Schema>(
  path: string,
  schema: T,
  value: unknown,
  resolvedRefs?: ReadonlyMap<string, Schema>
): { schema: Schema; value: unknown } | null {
  const segments = path.split(/[.[\]]/).filter(Boolean);

  let acc: Accumulator = { schema, value };

  for (let i = 1; i < segments.length; i++) {
    if (acc === null) {
      break;
    }

    if (acc.schema.type === SchemaType.SCHEMA_REF) {
      const currentPath = segments.slice(0, i).join(".");
      const resolved = resolvedRefs?.get(currentPath);

      if (resolved === undefined) {
        throw new Error(
          `Cannot resolve nested path "${path}": the schema_ref "${acc.schema.uri}" at "${currentPath}" has not been resolved`
        );
      }

      acc = { schema: resolved, value: acc.value };
    }

    acc = step(acc, segments[i], path);
  }

  return acc === null
    ? null
    : {
        schema: acc.schema,
        value: coerceSchema(acc.schema, acc.value),
      };
}

function step(acc: { schema: Schema; value: unknown }, cur: string, path: string): Accumulator {
  if (acc.schema.type === SchemaType.ARRAY) {
    const resolvedValue = withDefault(acc.schema, acc.value);

    if (!Array.isArray(resolvedValue)) {
      throw new Error(`Expected an array at path ${path}, but got ${typeof resolvedValue}`);
    }

    const val = resolvedValue[+cur];

    return {
      value: withDefault(acc.schema.schema, val),
      schema: acc.schema.schema,
    };
  }

  if (acc.schema.type === SchemaType.OBJECT) {
    const resolvedValue = withDefault(acc.schema, acc.value);

    if (resolvedValue !== undefined && resolvedValue !== null && !isObject(resolvedValue)) {
      throw new Error(`Expected an object at path ${path}, but got ${typeof resolvedValue}`);
    }

    const val = resolvedValue === undefined || resolvedValue === null ? undefined : resolvedValue[cur];
    const childSchema = acc.schema.fields[cur];

    if (childSchema === undefined) {
      throw new Error(`No schema found for path ${path}`);
    }

    return {
      value: withDefault(childSchema, val),
      schema: childSchema,
    };
  }

  if (acc.schema.type === SchemaType.DISCRIMINATED_UNION) {
    // A missing union falls back to its own default, the same way OBJECT/ARRAY
    // do above — without this, `ref()` into an absent-but-defaulted union's
    // member would never resolve.
    const resolvedValue = withDefault(acc.schema, acc.value);

    // if the key is referenced return the schema of the union type
    if (cur === acc.schema.key) {
      return {
        value: isObject(resolvedValue) ? resolvedValue[acc.schema.key] : undefined,
        schema: acc.schema,
      };
    }

    if (resolvedValue === undefined || resolvedValue === null) {
      return null;
    }

    if (!isObject(resolvedValue)) {
      throw new Error(`Expected an object at path ${path}, but got ${typeof resolvedValue}`);
    }
    const { key } = acc.schema;

    const discriminatorValue = resolvedValue[key];
    const matchingMember = acc.schema.schemas.find((s) => s[key] === discriminatorValue);

    if (matchingMember === undefined) {
      return null;
    }

    const childSchema = matchingMember[cur];

    if (childSchema === undefined) {
      return null;
    }

    if (typeof childSchema === "string" || typeof childSchema === "number" || typeof childSchema === "boolean") {
      return {
        value: isObject(resolvedValue) ? resolvedValue[acc.schema.key] : undefined,
        schema: acc.schema,
      };
    }

    return {
      value: withDefault(childSchema, resolvedValue[cur]),
      schema: childSchema,
    };
  }

  throw new Error("Cannot get nested value on non array or non object");
}
