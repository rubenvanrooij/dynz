import type { Predicate } from "../functions";
import type { PrivateValue } from "../private";
import type {
  ArraySchema,
  BooleanSchema,
  DateSchema,
  DiscriminatedUnionSchema,
  EnumValue,
  EnumValues,
  FileSchema,
  NumberSchema,
  ObjectSchema,
  OptionsSchema,
  StringSchema,
} from "../schemas";
import type { EnumSchema } from "../schemas/enum";
import type { ExpressionSchema } from "../schemas/expression";
import type { LiteralSchema } from "../schemas/literal";
import type { BaseRule } from "./rules";
import type { Prettify, Unpacked } from "./utils";

export const SchemaType = {
  STRING: "string",
  DATE: "date",
  NUMBER: "number",
  OBJECT: "object",
  ARRAY: "array",
  OPTIONS: "options",
  BOOLEAN: "boolean",
  ENUM: "enum",
  FILE: "file",
  EXPRESSION: "expression",
  LITERAL: "literal",
  DISCRIMINATED_UNION: "discriminated_union",
} as const;

export type SchemaType = EnumValues<typeof SchemaType>;

export type BaseSchema<TValue, TType extends SchemaType, TRule extends BaseRule[] | undefined> = {
  type: TType;
  rules?: TRule;
  default?: TValue | undefined;
  required?: boolean | Predicate | undefined;
  mutable?: boolean | Predicate | undefined;
  included?: boolean | Predicate | undefined;
  private?: boolean | undefined;
};

// TODO: Remove this?
export type PrivateSchema = {
  private?: boolean | undefined;
};

export type Schema =
  | StringSchema
  | ObjectSchema<never>
  | NumberSchema
  | BooleanSchema
  | ArraySchema<never>
  | OptionsSchema
  | FileSchema
  | DateSchema
  | EnumSchema
  | ExpressionSchema
  | LiteralSchema
  | DiscriminatedUnionSchema<string, never>;

export type IsIncluded<T extends Schema> = T extends { included: true }
  ? true
  : T extends { included: false }
    ? false
    : // included is conditional
      T extends { included: object }
      ? false
      : true; // default included

export type IsRequired<T extends Schema> = T extends { required: true }
  ? true
  : T extends { required: false }
    ? false
    : // required is conditionally
      T extends { required: object }
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
                  : T extends typeof SchemaType.EXPRESSION
                    ? unknown
                    : T extends typeof SchemaType.LITERAL
                      ? string | number | boolean | null
                      : T extends typeof SchemaType.DISCRIMINATED_UNION
                        ? Record<string, unknown>
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

type DiscriminatedMemberValue<
  TKey extends string,
  TMember extends Record<string, Schema | string | number | boolean>,
> = TMember extends Record<string, Schema | string | number | boolean>
  ? {
      [K in keyof TMember as K extends TKey ? K : TMember[K] extends Schema ? K : never]: K extends TKey
        ? TMember[K]
        : TMember[K] extends Schema
          ? SchemaValuesInternal<TMember[K]>
          : never;
    }
  : never;

export type SchemaValuesInternal<T extends Schema> = T extends ObjectSchema<never>
  ? Prettify<ObjectValue<T>>
  : T extends ArraySchema<never>
    ? MakeOptional<T, Array<SchemaValuesInternal<T["schema"]>>>
    : T extends EnumSchema
      ? MakeOptional<T, EnumValues<T["enum"]>>
      : T extends OptionsSchema
        ? Unpacked<T["options"]>
        : T extends DiscriminatedUnionSchema<infer TKey, infer TSchemas>
          ? MakeOptional<T, DiscriminatedMemberValue<TKey, TSchemas[number]>>
          : T extends LiteralSchema
            ? MakeOptional<T, T["value"]>
            : MakeOptional<T, ValueType<T["type"]>>;

export type SchemaValues<T extends Schema> = Prettify<ApplyPrivacyMask<T, SchemaValuesInternal<T>>>;
