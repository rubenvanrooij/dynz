import { isIncluded, isMutable, isRequired } from "../conditions";
import { type Schema, SchemaType } from "../types";
import { getNested } from "../utils";
import { isObject } from "../validate/validate-type";

export type IncludedPath = {
  path: string;
  type: SchemaType;
  required: boolean;
  mutable: boolean;
};

/**
 * Returns every path that is currently included in the schema based on the provided values
 *
 * Array paths follow the actual number of items present in `values`, and a
 * discriminated union is only walked into its currently matching member. If
 * a container path is excluded (or a discriminated union has no matching
 * member), none of its descendants are walked or included in the result —
 * so every returned path is genuinely reachable.
 *
 * ```ts
 * const schema = object({
 *   name: string(),
 *   address: object({ street: string() }).setIncluded(eq("name", "known")),
 * });
 *
 * getIncludedPaths(schema, { name: "known" });
 * // [
 * //   { path: "$.name", type: "string", required: true, mutable: true },
 * //   { path: "$.address", type: "object", required: true, mutable: true },
 * //   { path: "$.address.street", type: "string", required: true, mutable: true },
 * // ]
 * ```
 */
export function getIncludedPaths<T extends Schema>(schema: T, values: unknown): IncludedPath[] {
  return _getIncludedPaths(schema, "$", schema, values);
}

function _getIncludedPaths(schema: Schema, path: string, rootSchema: Schema, values: unknown): IncludedPath[] {
  if (path !== "$" && !isIncluded(rootSchema, path, values)) {
    return [];
  }

  const paths: IncludedPath[] =
    path === "$"
      ? []
      : [
          {
            path,
            type: schema.type,
            required: isRequired(rootSchema, path, values),
            mutable: isMutable(rootSchema, path, values),
          },
        ];

  if (schema.type === SchemaType.OBJECT) {
    return paths.concat(
      Object.entries(schema.fields).flatMap(([key, fieldSchema]) =>
        _getIncludedPaths(fieldSchema, `${path}.${key}`, rootSchema, values)
      )
    );
  }

  if (schema.type === SchemaType.ARRAY) {
    const nested = getNested(path, rootSchema, values);

    if (nested === null || !Array.isArray(nested.value)) {
      return paths;
    }

    return paths.concat(
      nested.value.flatMap((_, index) => _getIncludedPaths(schema.schema, `${path}.[${index}]`, rootSchema, values))
    );
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    const nested = getNested(path, rootSchema, values);

    if (nested === null || !isObject(nested.value)) {
      return paths;
    }

    const discriminatorValue = nested.value[schema.key];
    const matchingMember = schema.schemas.find((member) => member[schema.key] === discriminatorValue);

    if (matchingMember === undefined) {
      return paths;
    }

    return paths.concat(
      Object.entries(matchingMember).flatMap(([key, fieldSchema]) =>
        typeof fieldSchema !== "object" ? [] : _getIncludedPaths(fieldSchema, `${path}.${key}`, rootSchema, values)
      )
    );
  }

  return paths;
}
