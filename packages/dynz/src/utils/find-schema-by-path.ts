import { type Schema, SchemaType } from "../types";
import { isNumber } from "../validate/validate";

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
