import { type OptionsValue, type OptionValue, type Schema, SchemaType } from "dynz";
import { applyRules } from "./convert-rules";
import { reportIssue } from "./report-issue";
import type { ConversionContext, JsonSchema } from "./types";

function isMandatory(schema: Schema): boolean {
  const isIncluded = schema.included === undefined || schema.included === true;
  const isRequired = schema.required === undefined || schema.required === true;
  return isIncluded && isRequired;
}

function jsonTypeOf(value: unknown): string {
  return typeof value;
}

function applyEnumValues(jsonSchema: JsonSchema, values: unknown[]): void {
  jsonSchema.enum = values;
  const types = Array.from(new Set(values.map(jsonTypeOf)));
  if (types.length === 1) {
    jsonSchema.type = types[0];
  } else if (types.length > 1) {
    jsonSchema.type = types;
  }
}

function collectOptionValues(options: OptionsValue, context: ConversionContext): unknown[] {
  const values: unknown[] = [];

  const visit = (option: OptionValue): void => {
    if (typeof option !== "object") {
      values.push(option);
      return;
    }

    if (option.enabled === false) {
      return;
    }

    if (typeof option.enabled === "object") {
      reportIssue(
        context,
        `An "options" entry has a predicate-based "enabled" flag; whether it's enabled can't be determined statically, so it was included in the JSON Schema "enum" anyway.`
      );
    }

    visit(option.value);
  };

  for (const option of options) {
    visit(option);
  }

  return values;
}

function isSchema(value: Schema | string | number | boolean): value is Schema {
  return typeof value === "object" && value !== null && "type" in value;
}

function shouldOmitField(schema: Schema, context: ConversionContext): boolean {
  return context.mode === "input" && schema.type === SchemaType.EXPRESSION;
}

function applyPrivacyWrapper(schema: Schema, innerSchema: JsonSchema): JsonSchema {
  if (schema.private !== true) {
    return innerSchema;
  }

  return {
    oneOf: [
      {
        type: "object",
        properties: { state: { const: "plain" }, value: innerSchema },
        required: ["state"],
      },
      {
        type: "object",
        properties: { state: { const: "masked" }, value: { type: "string" } },
        required: ["state", "value"],
      },
    ],
  };
}

function applyDefault(schema: Schema, jsonSchema: JsonSchema): void {
  if (schema.default === undefined) {
    return;
  }

  jsonSchema.default = schema.default instanceof Date ? schema.default.toISOString() : schema.default;
}

/**
 * Converts a dynz schema to a JSON Schema (2020-12) document. Rule values
 * and schema kinds without a JSON Schema equivalent are handled per
 * `context.errorMode`.
 */
export function convertSchema(schema: Schema, context: ConversionContext): JsonSchema {
  const jsonSchema = convertSchemaKind(schema, context);
  applyDefault(schema, jsonSchema);
  return applyPrivacyWrapper(schema, jsonSchema);
}

function convertSchemaKind(schema: Schema, context: ConversionContext): JsonSchema {
  switch (schema.type) {
    case SchemaType.STRING: {
      const jsonSchema: JsonSchema = { type: "string" };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.NUMBER: {
      const jsonSchema: JsonSchema = { type: "number" };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.BOOLEAN: {
      const jsonSchema: JsonSchema = { type: "boolean" };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.DATE: {
      // JSON Schema has no native date type; represented as an ISO 8601 string.
      const jsonSchema: JsonSchema = { type: "string", format: "date-time" };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.LITERAL: {
      return { const: schema.value };
    }

    case SchemaType.ENUM: {
      const jsonSchema: JsonSchema = {};
      applyEnumValues(jsonSchema, Object.values(schema.enum));
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.OPTIONS: {
      const jsonSchema: JsonSchema = {};
      applyEnumValues(jsonSchema, collectOptionValues(schema.options, context));
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.FILE: {
      // JSON Schema has no native file type; a "mime_type" rule (if static) adds contentMediaType.
      const jsonSchema: JsonSchema = { type: "string" };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.EXPRESSION: {
      // Expression values are computed at runtime; their type can't be known ahead of time.
      // As an object/discriminated-union field, this is only reached in "output" mode —
      // in "input" mode such fields are omitted entirely by shouldOmitField().
      return {};
    }

    case SchemaType.ARRAY: {
      const jsonSchema: JsonSchema = {
        type: "array",
        items: convertSchema(schema.schema, context),
      };
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.OBJECT: {
      const properties: Record<string, JsonSchema> = {};
      const required: string[] = [];

      for (const [key, fieldSchema] of Object.entries(schema.fields)) {
        if (shouldOmitField(fieldSchema, context)) {
          continue;
        }

        properties[key] = convertSchema(fieldSchema, context);
        if (isMandatory(fieldSchema)) {
          required.push(key);
        }
      }

      const jsonSchema: JsonSchema = { type: "object", properties };
      if (required.length > 0) {
        jsonSchema.required = required;
      }
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.DISCRIMINATED_UNION: {
      const members = schema.schemas.map((member) => {
        const properties: Record<string, JsonSchema> = {
          [schema.key]: { const: member[schema.key] },
        };
        const required: string[] = [schema.key];

        for (const [key, value] of Object.entries(member)) {
          if (key === schema.key || !isSchema(value) || shouldOmitField(value, context)) {
            continue;
          }

          properties[key] = convertSchema(value, context);
          if (isMandatory(value)) {
            required.push(key);
          }
        }

        return { type: "object", properties, required } satisfies JsonSchema;
      });

      return { oneOf: members };
    }

    default: {
      reportIssue(context, `Unknown schema type cannot be converted to JSON Schema.`);
      return {};
    }
  }
}
