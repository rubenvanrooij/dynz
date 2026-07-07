import type { Rule, SchemaType } from "dynz";
import { reportIssue } from "./report-issue";
import { resolveStatic } from "./resolve-static";
import type { ConversionContext, JsonSchema } from "./types";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
        jsonSchema.minimum = min.value as number;
      } else {
        reportIssue(context, `"min" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max": {
      const max = resolveStatic(rule.max);
      if (max.ok) {
        jsonSchema.maximum = max.value as number;
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
          jsonSchema.minItems = min.value as number;
        } else {
          jsonSchema.minLength = min.value as number;
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
          jsonSchema.maxItems = max.value as number;
        } else {
          jsonSchema.maxLength = max.value as number;
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
        jsonSchema.minProperties = min.value as number;
      } else {
        reportIssue(context, `"min_entries" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max_entries": {
      const max = resolveStatic(rule.max);
      if (max.ok) {
        jsonSchema.maxProperties = max.value as number;
      } else {
        reportIssue(context, `"max_entries" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "max_precision": {
      const maxPrecision = resolveStatic(rule.maxPrecision);
      if (maxPrecision.ok) {
        jsonSchema.multipleOf = 1 / 10 ** (maxPrecision.value as number);
      } else {
        reportIssue(context, `"max_precision" rule with a non-static value cannot be converted to JSON Schema.`);
      }
      break;
    }

    case "regex": {
      jsonSchema.pattern = rule.regex;
      if (rule.flags) {
        reportIssue(
          context,
          `"regex" rule flags ("${rule.flags}") cannot be represented in JSON Schema's "pattern" keyword and were ignored.`
        );
      }
      break;
    }

    case "email": {
      jsonSchema.format = "email";
      break;
    }

    case "is_numeric": {
      // Best-effort approximation: JSON Schema has no dedicated "numeric string" keyword.
      jsonSchema.pattern = "^[+-]?\\d+(\\.\\d+)?$";
      break;
    }

    case "equals": {
      const equals = resolveStatic(rule.equals);
      if (equals.ok) {
        jsonSchema.const = equals.value;
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
        jsonSchema.contains = { const: includes.value };
      } else {
        jsonSchema.pattern = escapeRegExp(String(includes.value));
      }
      break;
    }

    case "not_includes": {
      const notIncludes = resolveStatic(rule.notIncludes);
      if (!notIncludes.ok) {
        reportIssue(context, `"not_includes" rule with a non-static value cannot be converted to JSON Schema.`);
        break;
      }

      jsonSchema.not =
        schemaType === "array"
          ? { contains: { const: notIncludes.value } }
          : { pattern: escapeRegExp(String(notIncludes.value)) };
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
      jsonSchema.enum = values;
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
      jsonSchema.not = { enum: values };
      break;
    }

    case "mime_type": {
      const mimeType = resolveStatic(rule.mimeType);
      if (!mimeType.ok) {
        reportIssue(context, `"mime_type" rule with a non-static value cannot be converted to JSON Schema.`);
        break;
      }

      if (typeof mimeType.value === "string") {
        jsonSchema.contentMediaType = mimeType.value;
      } else if (Array.isArray(mimeType.value) && mimeType.value.length === 1) {
        jsonSchema.contentMediaType = mimeType.value[0];
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
