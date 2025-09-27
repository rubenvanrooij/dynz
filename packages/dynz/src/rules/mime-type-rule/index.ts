import { type Reference, unpackRef } from "../../reference";
import type { FileSchema } from "../../schemas/file/types";
import type { ErrorMessageFromRule, RuleFn } from "../../types";
import { isArray } from "../../validate";

export type MimeTypeRule<T extends string | string[] | Reference = string | string[] | Reference> = {
  type: "mime_type";
  mimeType: T;
  code?: string | undefined;
};

export type MimeTypeRuleErrorMessage = ErrorMessageFromRule<MimeTypeRule>;

export function mimeType<T extends string | string[] | Reference>(mimeType: T, code?: string): MimeTypeRule<T> {
  return { mimeType, type: "mime_type", code };
}

export const mimeTypeRule: RuleFn<FileSchema, MimeTypeRule, MimeTypeRuleErrorMessage> = ({
  rule,
  value,
  path,
  context,
}) => {
  const { value: mimeType } = unpackRef(rule.mimeType, path, context);

  if (mimeType === undefined) {
    return undefined;
  }

  const mimeTypes = isArray(mimeType) ? mimeType : [mimeType];

  return mimeTypes.includes(value.type)
    ? undefined
    : {
        code: "mime_type",
        mimeType: value.type,
        message: `The mime type ${value.type} for schema ${path} is not equal to ${mimeType}`,
      };
};
