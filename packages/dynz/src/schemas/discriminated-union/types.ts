import type { BaseSchema, Schema, SchemaType } from "../../types";
import type { DynamicOptionValue } from "../options/types";

// Per-element validation type: discriminator key accepts primitives or a DynamicOptionValue
// (to conditionally enable/disable that member, exactly like an options() value), all other
// keys must be Schema. Used as a self-referential constraint in discriminatedUnion() so
// TypeScript checks each key individually rather than collapsing the condition into a single
// index signature.
export type CheckMember<TKey extends string, T> = {
  [K in keyof T]: K extends TKey ? string | number | boolean | DynamicOptionValue : T[K] extends Schema ? T[K] : never;
};

export type DiscriminatedUnionSchema<
  TKey extends string = string,
  TSchemas extends Record<string, Schema | string | number | boolean | DynamicOptionValue>[] = Record<
    string,
    Schema | string | number | boolean | DynamicOptionValue
  >[],
> = BaseSchema<unknown, typeof SchemaType.DISCRIMINATED_UNION, never> & {
  key: TKey;
  schemas: [TSchemas] extends [never]
    ? Record<string, Schema | string | number | boolean | DynamicOptionValue>[]
    : TSchemas;
};
