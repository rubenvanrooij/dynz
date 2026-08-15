import type { ConversionContext } from "./types";

/**
 * Reports an unsupported or unresolvable conversion according to the
 * configured error mode: throws, warns via `console.warn`, or is a no-op.
 */
export function reportIssue(context: ConversionContext, message: string): void {
  if (context.errorMode === "throw") {
    throw new Error(message);
  }

  if (context.errorMode === "warn") {
    console.warn(`[@dynz/to-json-schema] ${message}`);
  }
}
