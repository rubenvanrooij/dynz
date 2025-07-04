import {
  type ArraySchema,
  type BooleanSchema,
  type DateStringSchema,
  type FileSchema,
  type NumberSchema,
  type ObjectSchema,
  type Optional,
  type OptionsSchema,
  type Prettify,
  type Schema,
  SchemaType,
  type StringSchema,
} from "./types";

export function string(): StringSchema;
export function string<const T extends Omit<StringSchema, "type">>(value: T): Prettify<T & Pick<StringSchema, "type">>;
export function string<const T extends Omit<StringSchema, "type">>(value?: T): StringSchema {
  return {
    ...(value || {}),
    type: SchemaType.STRING,
  };
}

export const object = <const T extends Record<string, Schema>, const A extends Omit<ObjectSchema<T>, "type">>(
  value: A
): Prettify<A & Pick<ObjectSchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.OBJECT,
  };
};

export const DEFAULT_DATE_STRING_FORMAT = "yyyy-MM-dd";

export function number(): NumberSchema;
export function number<const T extends Omit<NumberSchema, "type">>(value: T): Prettify<T & Pick<NumberSchema, "type">>;
export function number<const A extends Omit<NumberSchema, "type">>(value?: A): NumberSchema {
  return {
    ...(value || {}),
    type: SchemaType.NUMBER,
  };
}

export function boolean(): BooleanSchema;
export function boolean<const T extends Omit<BooleanSchema, "type">>(
  value: T
): Prettify<T & Pick<BooleanSchema, "type">>;
export function boolean<A extends Omit<BooleanSchema, "type">>(value?: A): BooleanSchema {
  return {
    ...(value || {}),
    type: SchemaType.BOOLEAN,
  };
}

export function file(): FileSchema;
export function file<const T extends Omit<FileSchema, "type">>(value: T): Prettify<T & Pick<FileSchema, "type">>;
export function file<A extends Omit<FileSchema, "type">>(value?: A): FileSchema {
  return {
    ...(value || {}),
    type: SchemaType.FILE,
  };
}

export function options<const T extends Omit<OptionsSchema, "type">>(
  value: T
): Prettify<T & Pick<OptionsSchema, "type">> {
  return {
    ...(value || {}),
    type: SchemaType.OPTIONS,
  };
}

export function dateString(): DateStringSchema;
export function dateString<
  const T extends string,
  const A extends Optional<Omit<DateStringSchema<T>, "type">, "format">,
>(value: A): Prettify<A & Pick<DateStringSchema<T>, "format"> & Pick<DateStringSchema<T>, "type">>;
export function dateString<
  const T extends string,
  const A extends Optional<Omit<DateStringSchema<T>, "type">, "format">,
>(value?: A): DateStringSchema {
  return {
    ...value,
    format: value?.format || DEFAULT_DATE_STRING_FORMAT,
    type: SchemaType.DATE_STRING,
  };
}

export const array = <const T extends Schema, const A extends Omit<ArraySchema<T>, "type">>(
  value: A
): Prettify<A & Pick<ArraySchema<T>, "type">> => {
  return {
    ...value,
    type: SchemaType.ARRAY,
  };
};

export function optional<const T extends Schema>(schema: T): T & { required: false } {
  return {
    ...schema,
    required: false,
  };
}

export function required<const T extends Schema>(schema: T): T & { required: true } {
  return {
    ...schema,
    required: true,
  };
}
