import { SchemaType } from "../types";
import { isDate } from "../validate/validate-type";
import { coerce } from "./coerce";

/**
 * Value equality used by `eq`/`neq` and the `equals`/`not_equals` rules:
 * when either side is a Date both sides are compared by instant (the other
 * side may be an ISO string, e.g. a static date after `serialize()`),
 * everything else is compared by identity.
 */
export function isEqualValue(left: unknown, right: unknown): boolean {
  if (isDate(left) || isDate(right)) {
    const l = coerce(SchemaType.DATE, left);
    const r = coerce(SchemaType.DATE, right);
    return isDate(l) && isDate(r) && l.getTime() === r.getTime();
  }

  return left === right;
}
