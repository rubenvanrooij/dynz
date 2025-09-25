export type EnumValues<T> = T[keyof T];
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
