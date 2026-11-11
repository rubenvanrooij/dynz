import type { Schema } from "../types";
import { getNested } from "./get-nested";

/**
 * Replaces every `[]` (any array item) in `path` with the indices of the items present in
 * `values`, outermost first. A missing or empty array gives no paths.
 *
 * @example
 * const schema = object({
 *   drivers: array(object({ claims: array(object({ year: number() })) })),
 * });
 * const values = { drivers: [{ claims: [{ year: 2020 }, { year: 2022 }] }, { claims: [] }] };
 *
 * expandArrayItems("$.drivers.[].claims.[].year", schema, values);
 * // ["$.drivers.[0].claims.[0].year", "$.drivers.[0].claims.[1].year"]
 *
 * expandArrayItems("$.drivers.[]", schema, { drivers: [] }); // []
 * expandArrayItems("$.drivers", schema, values);             // ["$.drivers"]
 */
export function expandArrayItems(path: string, schema: Schema, values: unknown): string[] {
  const index = path.indexOf("[]");

  if (index === -1) {
    return [path];
  }

  // the array itself: the path up to the `.` before `[]`
  const items = getNested(path.slice(0, index - 1), schema, values)?.value;

  return (Array.isArray(items) ? items : []).flatMap((_, item) =>
    expandArrayItems(`${path.slice(0, index)}[${item}]${path.slice(index + 2)}`, schema, values)
  );
}
