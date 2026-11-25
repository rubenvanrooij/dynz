import { expandArrayItems, pathSegments, type ResourceStates, type Schema } from "dynz";

/**
 * The instance paths whose state differs between `previous` and `next`. Unchanged states keep
 * their object identity, so identity tells what changed.
 */
export function changedResourcePaths(previous: ResourceStates, next: ResourceStates): string[] {
  return Object.keys({ ...previous, ...next }).filter((path) => previous[path] !== next[path]);
}

/**
 * The schema paths that read any of the resource instances at `changed`, with every `[]`
 * expanded to the array items present in `values`. Matches by resource name, so a changed
 * `$.drivers.[1].driverClaims` returns the dependents of `driverClaims` in every item.
 *
 * @param dependents - from {@link getResourceDependents}
 *
 * @example
 * fieldPathsReadingResources(["$.vehicle"], { vehicle: ["$.make"] }, schema, values) // ["$.make"]
 */
export function fieldPathsReadingResources(
  changed: string[],
  dependents: Record<string, string[]>,
  schema: Schema,
  values: unknown
): string[] {
  const paths = changed
    .flatMap((path) => dependents[pathSegments(path).at(-1) ?? ""] ?? [])
    .flatMap((path) => expandArrayItems(path, schema, values));

  return [...new Set(paths)];
}
