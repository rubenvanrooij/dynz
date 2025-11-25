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

export type ErrorMessageFromRule<T extends { type: string; code?: string | undefined }> = Prettify<
  BaseErrorMessage & Omit<T, "code" | "type"> & { code: T["type"] }
>;
