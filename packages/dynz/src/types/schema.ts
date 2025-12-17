import type { Condition } from "../conditions";
import type { PrivateValue } from "../private";
import type { ConditionalRule } from "../rules";
import type {
  ArraySchema,
  BooleanSchema,
  DateSchema,
  DateStringSchema,
  EnumValue,
  EnumValues,
  FileSchema,
  NumberSchema,
  ObjectSchema,
  OptionsSchema,
  StringSchema,
} from "../schemas";
import type { EnumSchema } from "../schemas/enum";
import type { BaseRule } from "./rules";
import type { DateString, Prettify, Unpacked } from "./utils";

export const SchemaType = {
  STRING: "string",
  DATE: "date",
  DATE_STRING: "date_string",
  NUMBER: "number",
  OBJECT: "object",
  ARRAY: "array",
  OPTIONS: "options",
  BOOLEAN: "boolean",
  ENUM: "enum",
  FILE: "file",
} as const;

export type SchemaType = EnumValues<typeof SchemaType>;

export type BaseSchema<TValue, TType extends SchemaType, TRule extends BaseRule> = {
  type: TType;
  rules?: Array<TRule | ConditionalRule<TRule, never>>;
  default?: TValue;
  required?: boolean | Condition;
  mutable?: boolean | Condition;
  included?: boolean | Condition;
  private?: boolean;
};

// TODO: Remove this?
export type PrivateSchema = {
  private?: boolean;
};

export type Schema =
  | StringSchema
  | ObjectSchema<never>
  | NumberSchema
  | BooleanSchema
  | ArraySchema<never>
  | DateStringSchema
  | OptionsSchema
  | FileSchema
  | DateSchema
  | EnumSchema;

/**
 * All possible rules that can be applied to a schema
 */
export type Rule = Unpacked<Exclude<Schema["rules"], undefined>>;

export type IsIncluded<T extends Schema> = T extends { included: true }
  ? true
  : T extends { included: false }
    ? false
    : // required is conditionally
      T["included"] extends object
      ? false
      : true; // default included

export type IsRequired<T extends Schema> = T extends { required: true }
  ? true
  : T extends { required: false }
    ? false
    : // required is conditionally
      T["required"] extends object
      ? false
      : true; // default required

export type IsPrivate<T extends Schema> = T extends { private: true } ? true : false;

// === Computed Properties ===
export type IsMandatory<T extends Schema> = IsIncluded<T> extends true ? IsRequired<T> : false;

export type IsOptionalField<T extends Schema> = IsMandatory<T> extends false ? true : false;

// === Value Transformers ===
export type MakeOptional<T extends Schema, V> = IsOptionalField<T> extends true ? V | undefined : V;

export type ApplyPrivacyMask<T extends Schema, V> = IsPrivate<T> extends true ? PrivateValue<V> : V;

export type ValueType<T extends SchemaType = SchemaType> = T extends typeof SchemaType.STRING
  ? string
  : T extends typeof SchemaType.DATE_STRING
    ? DateString
    : T extends typeof SchemaType.DATE
      ? Date
      : T extends typeof SchemaType.NUMBER
        ? number
        : T extends typeof SchemaType.OBJECT
          ? Record<string, unknown>
          : T extends typeof SchemaType.ARRAY
            ? ValueType[]
            : T extends typeof SchemaType.BOOLEAN
              ? boolean
              : T extends typeof SchemaType.OPTIONS
                ? string | number
                : T extends typeof SchemaType.FILE
                  ? File
                  : T extends typeof SchemaType.ENUM
                    ? EnumValue
                    : never;

export type ValueTypeOrUndefined = ValueType | undefined | Array<ValueType | undefined>;

type OptionalFields<T extends ObjectSchema<never>> = {
  [K in keyof T["fields"] as IsOptionalField<T["fields"][K]> extends true ? K : never]?: SchemaValuesInternal<
    T["fields"][K]
  >;
};

type RequiredFields<T extends ObjectSchema<never>> = {
  [K in keyof T["fields"] as IsOptionalField<T["fields"][K]> extends false ? K : never]-?: SchemaValuesInternal<
    T["fields"][K]
  >;
};

export type ObjectValue<T extends ObjectSchema<never>> = OptionalFields<T> & RequiredFields<T>;

export type SchemaValuesInternal<T extends Schema> = T extends ObjectSchema<never>
  ? Prettify<ObjectValue<T>>
  : T extends ArraySchema<never>
    ? MakeOptional<T, Array<SchemaValuesInternal<T["schema"]>>>
    : T extends EnumSchema
      ? MakeOptional<T, EnumValues<T["enum"]>>
      : T extends OptionsSchema
        ? Unpacked<T["options"]>
        : MakeOptional<T, ValueType<T["type"]>>;

export type SchemaValues<T extends Schema> = Prettify<ApplyPrivacyMask<T, SchemaValuesInternal<T>>>;
