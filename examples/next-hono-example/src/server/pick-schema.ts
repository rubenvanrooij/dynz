import { type ObjectSchema, type Schema, SchemaType } from "dynz";

const isWithin = (path: string, ancestor: string) => path === ancestor || path.startsWith(`${ancestor}.`);

/**
 * A copy of `schema` with only `paths` (such as `driver.name`) and the `resources` named,
 * declared on the objects that declare them. Objects around a picked path keep their own
 * properties, so their conditions still apply. The paths stay the same, so a reference in a
 * copied field resolves as before — as long as what it refers to is picked too.
 */
export function pickSchema(schema: Schema, paths: string[], resources: string[], path = ""): Schema | undefined {
  if (paths.includes(path)) {
    return schema;
  }

  if (schema.type !== SchemaType.OBJECT || (path !== "" && !paths.some((picked) => isWithin(picked, path)))) {
    return undefined;
  }

  const fields = Object.entries(schema.fields).flatMap(([name, field]) => {
    const picked = pickSchema(field, paths, resources, path === "" ? name : `${path}.${name}`);
    return picked ? [[name, picked] as const] : [];
  });
  const declared = Object.entries(schema.resources ?? {}).filter(([name]) => resources.includes(name));

  return {
    ...schema,
    fields: Object.fromEntries(fields),
    resources: declared.length > 0 ? Object.fromEntries(declared) : undefined,
  } as ObjectSchema<never>;
}
