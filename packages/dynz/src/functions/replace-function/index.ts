import { type ToParam, toParamaterValue } from "../../schemas";
import type { ValueType } from "../../types";
import { isString } from "../../validate/validate-type";
import type { ParamaterValue } from "../types";

export const replaceFunctionType = "replace";

export type ReplaceFunction<
  TValue extends ParamaterValue = never,
  TPattern extends ParamaterValue = never,
  TReplacement extends ParamaterValue = never,
> = {
  type: typeof replaceFunctionType;
  value: [TValue] extends [never] ? ParamaterValue : TValue;
  pattern: [TPattern] extends [never] ? ParamaterValue : TPattern;
  replacement: [TReplacement] extends [never] ? ParamaterValue : TReplacement;
  flags?: string | undefined;
};

/**
 * Creates a replace transformer that replaces regex matches in a string.
 *
 * Transformers compute values that can be used as inputs to rules or predicates.
 * The pattern is stored as a plain string (not a `RegExp` instance) so the
 * schema stays JSON-serializable — it's compiled into a `RegExp` at resolve time.
 *
 * @category Transformer
 * @param value - The string value to run the replacement on (reference, static value, or another transformer)
 * @param pattern - The regex pattern source, e.g. `\\s+` (reference, static value, or another transformer)
 * @param replacement - The replacement string, supports `$1`-style capture groups (reference, static value, or another transformer)
 * @param flags - Optional regex flags, e.g. `g` to replace all matches
 * @returns A Transformer that computes the string with matches replaced
 *
 * @example
 * // Collapse repeated whitespace in a free-text field
 * eq(replace(ref('note'), v('\\s+'), v(' '), 'g'), ref('note'))
 *
 * @see {@link matches} - Predicate for regex matching
 * @see {@link trim} - Trim transformer
 */
export function replace<
  const TValue extends ParamaterValue<string> | string,
  const TPattern extends ParamaterValue<string> | string,
  const TReplacement extends ParamaterValue<string> | string,
>(
  value: TValue,
  pattern: TPattern,
  replacement: TReplacement,
  flags?: string
): ReplaceFunction<ToParam<TValue>, ToParam<TPattern>, ToParam<TReplacement>> {
  return {
    type: replaceFunctionType,
    value: toParamaterValue(value),
    pattern: toParamaterValue(pattern),
    replacement: toParamaterValue(replacement),
    flags,
  };
}

export function replaceFunction(
  value: ValueType | undefined,
  pattern: ValueType | undefined,
  replacement: ValueType | undefined,
  flags?: string
): string {
  if (!isString(value)) {
    return "";
  }

  if (!isString(pattern) || !isString(replacement)) {
    return value;
  }

  return value.replace(new RegExp(pattern, flags), replacement);
}
