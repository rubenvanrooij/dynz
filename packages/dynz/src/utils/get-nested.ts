import { type Schema, SchemaType } from "../types";
import { isObject } from "../validate/validate-type";
import { coerceSchema } from "./coerce";

export function getNested<T extends Schema>(
  path: string,
  schema: T,
  value: unknown
): { schema: Schema; value: unknown } | null {
  const result = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<{ schema: Schema; value: unknown } | null>(
      (acc, cur) => {
        if (acc === null) {
          return null;
        }

        if (acc.schema.type === SchemaType.ARRAY) {
          if (!Array.isArray(acc.value)) {
            throw new Error(`Expected an array at path ${path}, but got ${typeof acc.value}`);
          }

          const index = +cur;
          const val = acc.value[index];

          return {
            value: val === undefined ? acc.schema.default : val,
            schema: acc.schema.schema,
          };
        }

        if (acc.schema.type === SchemaType.OBJECT) {
          if (acc.value !== undefined && acc.value !== null && !isObject(acc.value)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof acc.value}`);
          }

          const val = acc.value === undefined || acc.value === null ? undefined : acc.value[cur];
          const childSchema = acc.schema.fields[cur];

          if (childSchema === undefined) {
            throw new Error(`No schema found for path ${path}`);
          }

          return {
            value: val === undefined ? acc.schema.fields[cur]?.default : val,
            schema: childSchema,
          };
        }

        if (acc.schema.type === SchemaType.DISCRIMINATED_UNION) {
          // if the key is referenced return the schema of the union type
          console.log("curssss", cur, acc.schema.key);
          if (cur === acc.schema.key) {
            return {
              value: isObject(acc.value) ? acc.value[acc.schema.key] : undefined,
              schema: acc.schema,
            };
          }

          if (acc.value === undefined || acc.value === null) {
            return null;
          }

          if (!isObject(acc.value)) {
            throw new Error(`Expected an object at path ${path}, but got ${typeof acc.value}`);
          }
          const { key } = acc.schema;

          const discriminatorValue = acc.value[key];
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
              value: isObject(acc.value) ? acc.value[acc.schema.key] : undefined,
              schema: acc.schema,
            };
          }

          return {
            value: acc.value,
            schema: childSchema,
          };
        }

        throw new Error("Cannot get nested value on non array or non object");
      },
      { value, schema }
    );

  return result === null
    ? null
    : {
        schema: result.schema,
        value: coerceSchema(result.schema, result.value),
      };
}
