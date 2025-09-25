import { unpackRefValue } from "../resolve";
import type { FileSchema } from "../schemas/file/types";
import { ErrorCode, type MimeTypeRule, type ValidateRuleContext } from "../types";
import { isArray } from "../validate";

export function mimeTypeRule({ rule, value, path, context }: ValidateRuleContext<FileSchema, MimeTypeRule>) {
  const mimeType = unpackRefValue(rule.mimeType, path, context);
  const mimeTypes = isArray(mimeType) ? mimeType : [mimeType];

  return mimeTypes.includes(value.type)
    ? undefined
    : {
        code: ErrorCode.MIME_TYPE,
        mimeType: value.type,
        message: `The mime type ${value.type} for schema ${path} is not equal to ${mimeType}`,
      };
}
