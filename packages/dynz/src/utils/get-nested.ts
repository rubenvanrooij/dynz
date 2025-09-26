import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate";
import { coerce } from "./coerce";

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
    value: coerce(result.schema, result.value),
  };
}
