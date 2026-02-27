import { type ParamaterValue, resolve } from "../../functions";
import type { FileSchema } from "../../schemas";
import type { ErrorMessageFromRule, ExtractResolvedRules, RuleFn, ValueType } from "../../types";

export type MimeTypeRule<T extends ParamaterValue<string | string[]> = ParamaterValue<string | string[]>> = {
  type: "mime_type";
  mimeType: T;
  code?: string | undefined;
};

export type MimeTypeRuleErrorMessage = ErrorMessageFromRule<MimeTypeRule, ValueType[], "mimeType">;

export function mimeType<T extends ParamaterValue<string | string[]>>(mimeType: T, code?: string): MimeTypeRule<T> {
  return { mimeType, type: "mime_type", code };
}

export const mimeTypeRule: RuleFn<
  FileSchema,
  Extract<ExtractResolvedRules<FileSchema>, MimeTypeRule>,
  MimeTypeRuleErrorMessage
> = ({ rule, value, path, context }) => {
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
