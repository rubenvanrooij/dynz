import type { ErrorMessage } from "dynz";
import { toFieldName } from "./utils";

export type MessageTransformerFunc = (errorMessage: ErrorMessage) => string;

/**
 * Maps dynz errors onto field names, keeping the first message per field.
 *
 * dynz reports absolute paths (`$.address.zip`); consumers address fields by name
 * (`address.zip`), which is also how VeeValidate and React Hook Form key their errors.
 */
export function toFieldErrors(
  errors: ErrorMessage[],
  messageTransformer?: MessageTransformerFunc
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const error of errors) {
    const name = toFieldName(error.path);

    if (result[name] === undefined) {
      result[name] = messageTransformer ? messageTransformer(error) : error.message;
    }
  }

  return result;
}

/** Same as {@link toFieldErrors} but keeps every message per field. */
export function toFieldErrorList(
  errors: ErrorMessage[],
  messageTransformer?: MessageTransformerFunc
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const name = toFieldName(error.path);
    const message = messageTransformer ? messageTransformer(error) : error.message;

    result[name] = result[name] === undefined ? [message] : [...result[name], message];
  }

  return result;
}
