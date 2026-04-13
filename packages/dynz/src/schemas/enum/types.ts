import type { Rule } from "../../rules";
import type { BaseSchema, SchemaType } from "../../types";

/**
 * Enum interface.
 */
export type EnumValue = string | number;
export type Enum = Readonly<Record<string, EnumValue>>;

/**
 * Enum value type
 */
export type EnumValues<TEnum extends Enum = Enum> = {
  [TKey in keyof TEnum]: TKey extends number
    ? TEnum[TKey] extends string
      ? TEnum[TEnum[TKey]] extends TKey
        ? never
        : TEnum[TKey]
      : TEnum[TKey]
    : TKey extends "NaN" | "Infinity" | "-Infinity"
      ? TEnum[TKey] extends string
        ? TEnum[TEnum[TKey]] extends number
          ? never
          : TEnum[TKey]
        : TEnum[TKey]
      : TKey extends `+${number}`
        ? TEnum[TKey]
        : TKey extends `${infer TNumber extends number}`
          ? TEnum[TKey] extends string
            ? TEnum[TEnum[TKey]] extends TNumber
              ? never
              : TEnum[TKey]
            : TEnum[TKey]
          : TEnum[TKey];
}[keyof TEnum];

/**
 * Enum schema interface
 */
export type EnumSchema<T extends Enum = Enum> = BaseSchema<EnumValues<T>, typeof SchemaType.ENUM, Rule> & {
  enum: T;
};
