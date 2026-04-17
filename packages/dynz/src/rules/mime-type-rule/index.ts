import { type ParamaterValue, resolve } from "../../functions";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, Schema, ValueType } from "../../types";
import { isFile } from "../../validate/validate-type";

export type MimeTypeRule<T extends ParamaterValue<string | string[]> = ParamaterValue<string | string[]>> = {
  type: "mime_type";
  mimeType: T;
  code?: string | undefined;
};

export type MimeTypeRuleErrorMessage = ErrorMessageFromRule<MimeTypeRule, ValueType[], "mimeType">;

export function buildMimeTypeRule<T extends ParamaterValue<string | string[]>>(
  mimeType: T,
  code?: string
): MimeTypeRule<T> {
  return { mimeType, type: "mime_type", code };
}

export const mimeTypeRule: RuleFn<
  Schema,
  Extract<ExtractResolvedRules<Schema>, MimeTypeRule>,
  MimeTypeRuleErrorMessage
> = ({ rule, value, path, context }) => {
  if (!isFile(value)) {
    throw new Error("mimeTypeRule expects a file value");
  }

  const mimeType = resolve(rule.mimeType, path, context);

  if (mimeType === undefined) {
    return undefined;
  }

  const mimeTypes = Array.isArray(mimeType) ? mimeType : [mimeType];

  return mimeTypes.includes(value.type)
    ? undefined
    : {
        code: "mime_type",
        mimeType: mimeTypes,
        message: `The mime type ${value.type} for schema ${path} is not equal to ${mimeType}`,
      };
};
