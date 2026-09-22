import { type Schema, SchemaType } from "../types";
import { isArray, isNumber, isObject } from "../validate/validate-type";
import { withDefault } from "./with-default";

export type FindSchemaByPathOptions<T extends Schema = Schema> = {
  /** Expected schema type; throws when the resolved schema has a different one. */
  type?: T["type"];
  /**
   * The document the path is resolved against. Only used to pick the matching member of
   * a discriminated union — a missing or wrong-shaped value never fails the lookup, it
   * just stops narrowing, so a half-filled form is still safe to resolve against.
   *
   * Schema defaults count as values: a field left out of the document falls back to its
   * schema's `default`, so a union whose discriminator only comes from a default still
   * narrows.
   */
  values?: unknown;
};

/**
 * The schema at `path`.
 *
 * Pass `values` whenever you have them: a discriminated union can only be narrowed by
 * the document, so without them a path crossing one resolves to the first member that
 * declares the field, which may not be the member the value is actually in.
 *
 * Use the options form when you want values without asserting a type:
 * `findSchemaByPath(path, schema, { values })`.
 */
export function findSchemaByPath(path: string, schema: Schema): Schema;
export function findSchemaByPath<T extends Schema = Schema>(
  path: string,
  schema: Schema,
  type: T["type"],
  values?: unknown
): T;
export function findSchemaByPath<T extends Schema = Schema>(
  path: string,
  schema: Schema,
  options: FindSchemaByPathOptions<T>
): T;
export function findSchemaByPath<T extends Schema = Schema>(
  path: string,
  schema: Schema,
  typeOrOptions?: T["type"] | FindSchemaByPathOptions<T>,
  maybeValues?: unknown
): Schema {
  // SchemaType values are all strings, so an object in the third slot is unambiguously
  // the options form.
  const { type, values } =
    typeof typeOrOptions === "object" && typeOrOptions !== null
      ? typeOrOptions
      : { type: typeOrOptions, values: maybeValues };

  const { schema: nestedSchema } = path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<{ schema: Schema; values: unknown }>(
      (prev, cur) => {
        if (prev.schema.type === SchemaType.ARRAY) {
          if (!isNumber(+cur)) {
            throw new Error(`Expected an array index at path ${path}, but got ${cur}`);
          }

          const values = withDefault(prev.schema, prev.values);

          return {
            schema: prev.schema.schema,
            values: isArray(values) ? values[+cur] : undefined,
          };
        }

        if (prev.schema.type === SchemaType.OBJECT) {
          const childSchema = prev.schema.fields[cur];

          if (childSchema === undefined) {
            throw new Error(`No schema found for path ${path}`);
          }

          const values = withDefault(prev.schema, prev.values);

          return {
            schema: childSchema,
            values: isObject(values) ? values[cur] : undefined,
          };
        }

        if (prev.schema.type === SchemaType.DISCRIMINATED_UNION) {
          const union = prev.schema;
          const values = withDefault(union, prev.values);
          // The discriminator falls back to the schema default on its own, not just when
          // the whole union value is missing. A form library registering a field
          // materialises the union as `{ someField: undefined }` — present, so `withDefault`
          // leaves it alone, yet still carrying no discriminator to narrow by.
          const defaults = withDefault(union, undefined);
          const discriminator =
            (isObject(values) ? values[union.key] : undefined) ??
            (isObject(defaults) ? defaults[union.key] : undefined);
          const matched = union.schemas.find((m) => m[union.key] === discriminator);

          for (const member of matched ? [matched, ...union.schemas] : union.schemas) {
            const childSchema = member[cur];

            if (childSchema !== undefined) {
              /**
               * When the childSchema is a primitive type then we need
               * to return the union schema since the union type doesnt
               * have an actual schema attached to it.
               */
              if (
                typeof childSchema === "boolean" ||
                typeof childSchema === "number" ||
                typeof childSchema === "string"
              ) {
                return {
                  schema: prev.schema,
                  values: isObject(values) ? values[cur] : undefined,
                };
              }

              return {
                schema: childSchema,
                values: isObject(values) ? values[cur] : undefined,
              };
            }
          }
          throw new Error(`No schema found for path ${path}`);
        }

        throw new Error(`Cannot find schema at path ${path}`);
      },
      { schema, values }
    );

  if (type !== undefined && nestedSchema.type !== type) {
    throw new Error(`Expected schema of type ${type} at path ${path}, but got ${nestedSchema.type}`);
  }

  return nestedSchema;
}

/**
 * A single path can resolve to multiple schemas: the members of a discriminated union
 * may each declare the same field differently, and without values there is nothing to
 * say which member applies.
 *
 * findPossibleSchemasByPath returns all the possible schemas for a given path
 */
export function findPossibleSchemasByPath(path: string, schema: Schema): Schema[] {
  return path
    .split(/[.[\]]/)
    .filter(Boolean)
    .splice(1)
    .reduce<Schema[]>(
      (prev, cur) => {
        const candidates = prev
          .flatMap((candidate) => resolveChildSchemas(candidate, cur, path))
          .filter((candidate, index, all) => all.indexOf(candidate) === index);

        if (candidates.length === 0) {
          throw new Error(
            prev.every(isContainer) ? `No schema found for path ${path}` : `Cannot find schema at path ${path}`
          );
        }

        return candidates;
      },
      [schema]
    );
}

/**
 * Takes one step along the path: given a schema and the next segment, returns the
 * schemas that segment leads to. A discriminated union returns one per member, since
 * any member could be the one that applies.
 *
 * When the segment isn't there, returns an empty list instead of throwing. A branch
 * that leads nowhere shouldn't break a lookup that another branch can still resolve.
 */
function resolveChildSchemas(schema: Schema, segment: string, path: string): Schema[] {
  if (schema.type === SchemaType.ARRAY) {
    if (!isNumber(+segment)) {
      throw new Error(`Expected an array index at path ${path}, but got ${segment}`);
    }

    return [schema.schema];
  }

  if (schema.type === SchemaType.OBJECT) {
    const childSchema = schema.fields[segment];

    return childSchema === undefined ? [] : [childSchema];
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    return schema.schemas.flatMap((member) => {
      const childSchema = member[segment];

      if (childSchema === undefined) {
        return [];
      }

      /**
       * When the childSchema is a primitive type then we need
       * to return the union schema since the union type doesnt
       * have an actual schema attached to it.
       */
      return [
        typeof childSchema === "boolean" || typeof childSchema === "number" || typeof childSchema === "string"
          ? schema
          : childSchema,
      ];
    });
  }

  return [];
}

function isContainer(schema: Schema): boolean {
  return (
    schema.type === SchemaType.ARRAY ||
    schema.type === SchemaType.OBJECT ||
    schema.type === SchemaType.DISCRIMINATED_UNION
  );
}
