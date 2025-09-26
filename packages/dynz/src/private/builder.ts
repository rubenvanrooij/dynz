import type { MaskedPrivateValue, PlainPrivateValue } from "./types";

const DEFAULT_MASK_FUNCTION = () => {
  return "***";
};

export function plain<A extends string | number>(value?: A): PlainPrivateValue<A> {
  return {
    state: "plain",
    value: value,
  };
}

export function mask<const T extends PlainPrivateValue<A>, const A extends string | number>(
  value?: T | A,
  maskFn: (value?: A) => string = DEFAULT_MASK_FUNCTION
): MaskedPrivateValue {
  return {
    state: "masked",
    value: maskFn(value ? (typeof value === "string" || typeof value === "number" ? value : value.value) : undefined),
  };
}
