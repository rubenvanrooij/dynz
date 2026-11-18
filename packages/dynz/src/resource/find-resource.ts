import { type Schema, SchemaType } from "../types";
import type { Resource } from "./resource";

export type ResourceDeclaration = {
  /** Absolute path of the object declaring the resource, e.g. `$.drivers.[2]`. */
  objectPath: string;
  /** The name the resource is declared under, e.g. `vehicle`. */
  name: string;
  /** Absolute path of this resource instance, e.g. `$.drivers.[2].vehicle`. */
  path: string;
  resource: Resource;
};

/**
 * The resources declared on the schema at `path` itself (not on its children). Only
 * object schemas declare resources; any other schema has none.
 */
export function getResources(schema: Schema, path: string): ResourceDeclaration[] {
  if (schema.type !== SchemaType.OBJECT) {
    return [];
  }

  return Object.entries(schema.resources ?? {}).map(([name, resource]) => ({
    objectPath: path,
    name,
    path: `${path}.${name}`,
    resource,
  }));
}

/**
 * Every resource declared anywhere in `schema`, outer declarations before inner ones.
 *
 * This walks the schema, not values: array items are addressed as `[]` (any item, as in
 * the dependency map), and every member of a discriminated union is visited. A field that
 * exists in several union members can therefore yield several declarations for one path.
 *
 * @example
 * findResources(object({ drivers: array(object({ plate: string() }).setResources({ vehicle })) }))
 * // [{ objectPath: "$.drivers.[]", path: "$.drivers.[].vehicle", resource: vehicle }]
 */
export function findResources(schema: Schema, path = "$"): ResourceDeclaration[] {
  if (schema.type === SchemaType.OBJECT) {
    return [
      ...getResources(schema, path),
      ...Object.entries(schema.fields).flatMap(([key, field]) => findResources(field, `${path}.${key}`)),
    ];
  }

  if (schema.type === SchemaType.ARRAY) {
    return findResources(schema.schema, `${path}.[]`);
  }

  if (schema.type === SchemaType.DISCRIMINATED_UNION) {
    return schema.schemas.flatMap((member) =>
      Object.entries(member).flatMap(([key, inner]) =>
        // literals (such as the discriminator) have no schema of their own
        typeof inner === "string" || typeof inner === "number" || typeof inner === "boolean"
          ? []
          : findResources(inner, `${path}.${key}`)
      )
    );
  }

  return [];
}
