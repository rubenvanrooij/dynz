import type { ParamaterValue, Static } from "../functions";
import type { ValueType } from "./schema";
import type { BaseErrorMessage } from "./validate";

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Filter<T extends unknown[], A> = T extends []
  ? []
  : T extends [infer H, ...infer R]
    ? H extends A
      ? Filter<R, A>
      : [H, ...Filter<R, A>]
    : T;

export type DateString = string;

export type JsonPrimitive = string | number | boolean;

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = { [key: string]: JsonValue };

export type Value<T extends ParamaterValue> = T extends Static ? T["value"] : ValueType;

export type ErrorMessageFromRule<
  TRule extends { type: string; code?: string | undefined },
  TValue = unknown,
  TKey extends keyof TRule = never,
> = Prettify<
  BaseErrorMessage & Omit<TRule, "code" | "type" | TKey> & { code: TRule["type"] } & { [K in TKey]: TValue }
>;
