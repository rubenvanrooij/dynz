import { type Prettify, SchemaType } from "../../types";
import type { Enum, EnumSchema } from "./types";

const _enum = <const T extends Enum, const A extends Omit<EnumSchema<T>, "type">>(
  value: A
): Prettify<A & Pick<EnumSchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.ENUM,
  };
};

export { _enum as enum };
