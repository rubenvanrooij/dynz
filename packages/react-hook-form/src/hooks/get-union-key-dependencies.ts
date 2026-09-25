import { findPossibleSchemasByPath, type Schema, SchemaType } from "dynz";

/**
 * Returns the discriminator field names of every discriminated union along `path`, as
 * form-relative names. `path` must be schema-absolute, e.g. `"$.items.0.amount"`.
 *
 * A hook that resolves a schema from values has to watch these. The schema it resolves
 * depends on the discriminator, so without the watch the hook never re-renders when the
 * user switches variant, and keeps showing the old one.
 *
 * All members are included, not just the one currently selected, so the watch stays in
 * place to notice the switch.
 */
export function getUnionKeyDependencies(path: string, schema: Schema): string[] {
  const segments = path.split(/[.[\]]/).filter(Boolean);

  return [
    ...new Set(
      segments.flatMap((_, i) => {
        const ancestorPath = segments.slice(0, i + 1).join(".");

        return findPossibleSchemasByPath(ancestorPath, schema)
          .filter((ancestor) => ancestor.type === SchemaType.DISCRIMINATED_UNION)
          .map((ancestor) => `${ancestorPath}.${ancestor.key}`.slice(2));
      })
    ),
  ];
}
