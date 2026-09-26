import { isPrivateSchema, type OptionsValue, type Schema, type SchemaMeta, SchemaType } from "dynz";
import { applyRules } from "./convert-rules";
import { reportIssue } from "./report-issue";
import type { ConversionContext, JsonSchema } from "./types";

function isMandatory(schema: Schema): boolean {
  const isIncluded = schema.included === undefined || schema.included === true;
  const isRequired = schema.required === undefined || schema.required === true;
  // dynz fills in a static default when a field is left empty (satisfies `required`
  // too — see withDefault), so a field with a default can be omitted from the
  // document. Listing it in `required` anyway contradicts `default`, which every
  // JSON Schema / OpenAPI consumer reads as "omit me and this is what you get".
  const hasDefault = "default" in schema && schema.default !== undefined;
  return isIncluded && isRequired && !hasDefault;
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

  for (const option of options) {
    if (typeof option !== "object") {
      values.push(option);
      continue;
    }

    if (option.enabled === false) {
      continue;
    }

    if (typeof option.enabled === "object") {
      reportIssue(
        context,
        `An "options" entry has a predicate-based "enabled" flag; whether it's enabled can't be determined statically, so it was included in the JSON Schema "enum" anyway.`
      );
    }

    values.push(option.value);
  }

  return values;
}

function isSchema(value: Schema | string | number | boolean): value is Schema {
  return typeof value === "object" && value !== null && "type" in value;
}

/**
 * Wraps a property's schema so it also accepts `null` — strict mode's only
 * way to express "may be absent", since every property must be listed in
 * `required`.
 */
function withNullable(jsonSchema: JsonSchema): JsonSchema {
  return { anyOf: [jsonSchema, { type: "null" }] };
}

/**
 * A `const` node, paired with its inferred `type` under `strict` (strict
 * mode requires `type` everywhere; a bare `const` has none otherwise).
 */
function constNode(value: string | number | boolean | null, strict: boolean): JsonSchema {
  return strict ? { const: value, type: value === null ? "null" : typeof value } : { const: value };
}

/**
 * Converts a set of object fields into `properties`/`required`, shared by
 * the OBJECT case and each `discriminatedUnion()` member. Under `strict`,
 * every non-omitted field is listed in `required` — one that isn't
 * otherwise mandatory has its schema widened to also accept `null`.
 */
function convertObjectFields(
  fields: Record<string, Schema>,
  context: ConversionContext
): { properties: Record<string, JsonSchema>; required: string[] } {
  const properties: Record<string, JsonSchema> = {};
  const required: string[] = [];

  for (const [key, fieldSchema] of Object.entries(fields)) {
    if (shouldOmitField(fieldSchema, context)) {
      continue;
    }

    const propertySchema = convertSchema(fieldSchema, context);
    const mandatory = isMandatory(fieldSchema);

    properties[key] = context.strict && !mandatory ? withNullable(propertySchema) : propertySchema;
    if (mandatory || context.strict) {
      required.push(key);
    }
  }

  return { properties, required };
}

function shouldOmitField(schema: Schema, context: ConversionContext): boolean {
  // A statically excluded field is not part of the document in either direction: dynz
  // errors on any value present for it, or strips it under `stripNotIncludedValues`.
  // Emitting it would describe a document the validator refuses.
  if (schema.included === false) {
    return true;
  }

  return context.mode === "input" && schema.type === SchemaType.EXPRESSION;
}

function applyPrivacyWrapper(schema: Schema, innerSchema: JsonSchema, context: ConversionContext): JsonSchema {
  // Validated output is always plain; only input may arrive wrapped or masked.
  if (!isPrivateSchema(schema) || context.mode !== "input") {
    return innerSchema;
  }

  // The field being entirely absent is already handled a level up — by whichever
  // convertObjectFields() call wraps this whole node in withNullable() when the
  // field itself isn't mandatory — so both branches here can simply require
  // both keys under `strict`: when `state` is "plain", `value` is always present.
  const plain: JsonSchema = {
    type: "object",
    properties: { state: constNode("plain", context.strict), value: innerSchema },
    required: context.strict ? ["state", "value"] : ["state"],
  };
  const masked: JsonSchema = {
    type: "object",
    properties: { state: constNode("masked", context.strict), value: { type: "string" } },
    required: ["state", "value"],
  };

  if (context.strict) {
    plain.additionalProperties = false;
    masked.additionalProperties = false;
  }

  // A raw value is accepted too, and treated as plain.
  return { [context.unionKeyword]: [innerSchema, plain, masked] };
}

function applyDefault(schema: Schema, jsonSchema: JsonSchema): void {
  if (schema.default === undefined) {
    return;
  }

  jsonSchema.default = schema.default instanceof Date ? schema.default.toISOString() : schema.default;
}

function applyMeta(schema: Schema, jsonSchema: JsonSchema): void {
  const meta = (schema as { meta?: SchemaMeta }).meta;
  if (!meta) {
    return;
  }

  const { id, title, description, deprecated, ...rest } = meta;
  if (id !== undefined) {
    jsonSchema.$id = id;
  }
  if (title !== undefined) {
    jsonSchema.title = title;
  }
  if (description !== undefined) {
    jsonSchema.description = description;
  }
  if (deprecated !== undefined) {
    jsonSchema.deprecated = deprecated;
  }
  Object.assign(jsonSchema, rest);
}

/**
 * Converts a dynz schema to a JSON Schema (2020-12) document. Rule values
 * and schema kinds without a JSON Schema equivalent are handled per
 * `context.errorMode`.
 */
export function convertSchema(schema: Schema, context: ConversionContext): JsonSchema {
  const jsonSchema = convertSchemaKind(schema, context);
  applyDefault(schema, jsonSchema);
  applyMeta(schema, jsonSchema);
  return applyPrivacyWrapper(schema, jsonSchema, context);
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
      return constNode(schema.value, context.strict);
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
      const { properties, required } = convertObjectFields(schema.fields, context);

      const jsonSchema: JsonSchema = { type: "object", properties };
      if (required.length > 0) {
        jsonSchema.required = required;
      }
      if (context.strict) {
        jsonSchema.additionalProperties = false;
      }
      applyRules(jsonSchema, schema.rules, schema.type, context);
      return jsonSchema;
    }

    case SchemaType.DISCRIMINATED_UNION: {
      const members = schema.schemas.map((member) => {
        const memberFields: Record<string, Schema> = {};
        for (const [key, value] of Object.entries(member)) {
          if (key !== schema.key && isSchema(value)) {
            memberFields[key] = value;
          }
        }

        const { properties, required } = convertObjectFields(memberFields, context);
        properties[schema.key] = constNode(member[schema.key] as string | number | boolean, context.strict);
        required.unshift(schema.key);

        const jsonSchema: JsonSchema = { type: "object", properties, required };
        if (context.strict) {
          jsonSchema.additionalProperties = false;
        }
        return jsonSchema;
      });

      return { [context.unionKeyword]: members };
    }

    default: {
      reportIssue(context, `Unknown schema type cannot be converted to JSON Schema.`);
      return {};
    }
  }
}
