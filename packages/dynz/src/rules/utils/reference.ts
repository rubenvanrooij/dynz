import type { UnpackedReferenceValue } from "../../reference";
import { SchemaType } from "../../types";
import { parseDateString } from "../../validate/validate-type";

/**
 * Parses a reference value in a date value
 *
 * @param reference
 * @returns
 */
export function getDateFromDateOrDateStringRefeference(
  reference: UnpackedReferenceValue<typeof SchemaType.DATE | typeof SchemaType.DATE_STRING>
): Date | undefined {
  if (reference.type === SchemaType.DATE) {
    return reference.value;
  }

  return reference.value !== undefined ? parseDateString(reference.value, reference.schema.format) : undefined;
}
