// import type { Condition } from "../conditions";
// import type { Reference, ValueOrReference } from "./reference";
// import type { Schema } from "./schema";
// import type { EnumValues, Unpacked } from "./utils";

import type { ConditionalRule } from "../rules";
import type { Schema } from "./schema";
import type { Unpacked } from "./utils";

export type BaseRule = {
  type: string;
  code?: string | undefined;
};

export type ExtractRules<T extends Schema> = Unpacked<Exclude<T["rules"], undefined>>;

export type ResolvedRules<TSchema extends Schema, T extends ExtractRules<TSchema> = ExtractRules<TSchema>> = Exclude<
  T,
  ConditionalRule<never, never>
>;

export type ExtractResolvedRules<T extends Schema> = ResolvedRules<T, ExtractRules<T>>;
