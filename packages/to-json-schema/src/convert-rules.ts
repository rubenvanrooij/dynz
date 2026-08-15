import type { Rule, SchemaType } from "dynz";
import { reportIssue } from "./report-issue";
import { resolveStatic } from "./resolve-static";
import type { ConversionContext, JsonSchema } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Writes a keyword, preserving whatever constraint is already there.
 *
 * Several dynz rules map onto the same JSON Schema keyword: two `regex` rules both want
 * `pattern`, `one_of` wants the `enum` an options schema has already produced,
 * `not_includes` and `not_one_of` both want `not`. A plain assignment would silently drop
 * the constraint that got there first, so a second writer is moved into `allOf` — where
 * both still have to hold.
 */
function setKeyword(jsonSchema: JsonSchema, keyword: string, value: unknown): void {
  if (jsonSchema[keyword] === undefined) {
    jsonSchema[keyword] = value;
    return;
  }

  jsonSchema.allOf = [...(jsonSchema.allOf ?? []), { [keyword]: value }];
}

/**
 * Applies a dynz rule to a JSON Schema in place. Rules whose value can't be
 * statically resolved (references, predicates, transformers) or that have
 * no JSON Schema equivalent are skipped and reported via `reportIssue`.
 */
export function applyRule(
  jsonSchema: JsonSchema,
  rule: Rule,
  schemaType: SchemaType,
  context: ConversionContext
): void {
  switch (rule.type) {
    case "min": {
      const min = resolveStatic(rule.min);
      if (min.ok) {
        setKeyword(jsonSchema, "minimum", min.value as number);
      } else {
        reportIssue(context, `"min" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max": {
      const max = resolveStatic(rule.max);
      if (max.ok) {
        setKeyword(jsonSchema, "maximum", max.value as number);
      } else {
        reportIssue(context, `"max" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "min_length": {
      // dynz reuses "min_length" for both string length and array length (via .min() on
      // either schema kind), so the JSON Schema keyword depends on which kind this is.
      const min = resolveStatic(rule.min);
      if (min.ok) {
        if (schemaType === "array") {
          setKeyword(jsonSchema, "minItems", min.value as number);
        } else {
          setKeyword(jsonSchema, "minLength", min.value as number);
        }
      } else {
        reportIssue(context, `"min_length" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max_length": {
      const max = resolveStatic(rule.max);
      if (max.ok) {
        if (schemaType === "array") {
          setKeyword(jsonSchema, "maxItems", max.value as number);
        } else {
          setKeyword(jsonSchema, "maxLength", max.value as number);
        }
      } else {
        reportIssue(context, `"max_length" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "min_entries": {
      // "min_entries"/"max_entries" are only produced by object schemas (.minEntries()), for
      // the number of keys — i.e. JSON Schema's "minProperties"/"maxProperties".
      const min = resolveStatic(rule.min);
      if (min.ok) {
        setKeyword(jsonSchema, "minProperties", min.value as number);
      } else {
        reportIssue(context, `"min_entries" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max_entries": {
      const max = resolveStatic(rule.max);
      if (max.ok) {
        setKeyword(jsonSchema, "maxProperties", max.value as number);
      } else {
        reportIssue(context, `"max_entries" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max_precision": {
      const maxPrecision = resolveStatic(rule.maxPrecision);
      if (maxPrecision.ok) {
        setKeyword(jsonSchema, "multipleOf", 1 / 10 ** (maxPrecision.value as number));
      } else {
        reportIssue(context, `"max_precision" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "regex": {
      setKeyword(jsonSchema, "pattern", rule.regex);
      if (rule.flags) {
        reportIssue(
          context,
          `"regex" rule flags ("${rule.flags}") cannot be represented in JSON Schema's "pattern" keyword and were ignored.`
        );
      }
      break;
    }

    case "email": {
      setKeyword(jsonSchema, "format", "email");
      break;
    }

    case "is_numeric": {
      // Best-effort approximation: JSON Schema has no dedicated "numeric string" keyword.
      setKeyword(jsonSchema, "pattern", "^[+-]?\\d+(\\.\\d+)?$");
      break;
    }

    case "equals": {
      const equals = resolveStatic(rule.equals);
      if (equals.ok) {
        setKeyword(jsonSchema, "const", equals.value);
      } else {
        reportIssue(context, `"equals" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "includes": {
      const includes = resolveStatic(rule.includes);
      if (!includes.ok) {
        reportIssue(context, `"includes" rule with a non-static value cannot be converted to JSON Schema.`);
        break;
      }

      if (schemaType === "array") {
        setKeyword(jsonSchema, "contains", { const: includes.value });
      } else {
        setKeyword(jsonSchema, "pattern", escapeRegExp(String(includes.value)));
      }
      break;
    }

    case "not_includes": {
      const notIncludes = resolveStatic(rule.notIncludes);
      if (!notIncludes.ok) {
        reportIssue(context, `"not_includes" rule with a non-static value cannot be converted to JSON Schema.`);
        break;
      }

      setKeyword(
        jsonSchema,
        "not",
        schemaType === "array"
          ? { contains: { const: notIncludes.value } }
          : { pattern: escapeRegExp(String(notIncludes.value)) }
      );
      break;
    }

    case "one_of": {
      const values: unknown[] = [];
      for (const value of rule.values) {
        const resolved = resolveStatic(value);
        if (!resolved.ok) {
          reportIssue(context, `"one_of" rule with a non-static value cannot be converted to JSON Schema.`);
          return;
        }
        values.push(resolved.value);
      }
      setKeyword(jsonSchema, "enum", values);
      break;
    }

    case "not_one_of": {
      const values: unknown[] = [];
      for (const value of rule.values) {
        const resolved = resolveStatic(value);
        if (!resolved.ok) {
          reportIssue(context, `"not_one_of" rule with a non-static value cannot be converted to JSON Schema.`);
          return;
        }
        values.push(resolved.value);
      }
      setKeyword(jsonSchema, "not", { enum: values });
      break;
    }

    case "mime_type": {
      const mimeType = resolveStatic(rule.mimeType);
      if (!mimeType.ok) {
        reportIssue(context, `"mime_type" rule with a non-static value cannot be converted to JSON Schema.`);
        break;
      }

      if (typeof mimeType.value === "string") {
        setKeyword(jsonSchema, "contentMediaType", mimeType.value);
      } else if (Array.isArray(mimeType.value) && mimeType.value.length === 1) {
        setKeyword(jsonSchema, "contentMediaType", mimeType.value[0]);
      } else {
        reportIssue(context, `"mime_type" rule with multiple mime types has no JSON Schema equivalent.`);
      }
      break;
    }

    case "min_date":
    case "max_date":
    case "before":
    case "after": {
      reportIssue(
        context,
        `"${rule.type}" rule has no JSON Schema equivalent (date comparisons aren't representable).`
      );
      break;
    }

    case "min_size":
    case "max_size": {
      reportIssue(
        context,
        `"${rule.type}" rule has no JSON Schema equivalent (byte-size constraints aren't representable).`
      );
      break;
    }

    case "custom": {
      reportIssue(context, `"custom" rule "${rule.name}" has no JSON Schema equivalent.`);
      break;
    }

    case "conditional": {
      reportIssue(context, `"conditional" rule has no JSON Schema equivalent.`);
      break;
    }

    default: {
      reportIssue(context, `Unknown rule cannot be converted to JSON Schema.`);
    }
  }
}

export function applyRules(
  jsonSchema: JsonSchema,
  rules: Rule[] | undefined,
  schemaType: SchemaType,
  context: ConversionContext
): void {
  for (const rule of rules ?? []) {
    applyRule(jsonSchema, rule, schemaType, context);
  }
}
