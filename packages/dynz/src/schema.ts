import {
  ArraySchema,
  NumberSchema,
  ObjectSchema,
  Schema,
  SchemaType,
  DateStringSchema,
  StringSchema,
  Rule,
  Optional,
} from './types';

function buildBuilder<T extends Schema>(type: T['type']) {
  return <A extends Omit<T, 'type'>>(value: A): A & Pick<T, 'type'> => {
    return {
      ...(value || {}),
      type,
    };
  };
}

// export const string = buildBuilder<StringSchema>(SchemaType.STRING);

export function string(): StringSchema;
export function string<T extends Omit<StringSchema, 'type'>>(
  value: T,
): T & Pick<StringSchema, 'type'>;
export function string<T extends Omit<StringSchema, 'type'>>(
  value?: T,
): StringSchema {
  return {
    ...(value || {}),
    type: SchemaType.STRING,
  };
}

export const object = <
  T extends Record<string, Schema>,
  A extends Omit<ObjectSchema<T>, 'type'>,
>(
  value: A,
): A & Pick<ObjectSchema<T>, 'type'> => {
  return {
    ...value,
    type: SchemaType.OBJECT,
  };
};

export const DEFAULT_DATE_STRING_FORMAT = 'yyyy-MM-dd';

export function dateString(): DateStringSchema;
export function dateString<
  T extends string,
  A extends Optional<Omit<DateStringSchema<T>, 'type'>, 'format'>,
>(
  value: A,
): A & Pick<DateStringSchema<T>, 'format'> & Pick<DateStringSchema<T>, 'type'>;
export function dateString<
  T extends string,
  A extends Optional<Omit<DateStringSchema<T>, 'type'>, 'format'>,
>(value?: A): DateStringSchema {
  return {
    ...value,
    format: (value && value.format) || DEFAULT_DATE_STRING_FORMAT,
    type: SchemaType.DATE_STRING,
  };
}

export const number = buildBuilder<NumberSchema>(SchemaType.NUMBER);
export const array = <
  const T extends Schema,
  A extends Omit<ArraySchema<T>, 'type'>,
>(
  value: A,
): A & Pick<ArraySchema<T>, 'type'> => {
  return {
    ...value,
    type: SchemaType.ARRAY,
  };
};

export function optional<T extends Schema>(schema: T): T & { required: false } {
  return {
    ...schema,
    required: false,
  };
}

export function required<T extends Schema>(schema: T): T & { required: true } {
  return {
    ...schema,
    required: true,
  };
}

export function rules<T extends Schema, A extends Rule>(
  schema: T,
  ...rules: A[]
): T & { rules: A[] } {
  return {
    ...schema,
    rules: rules,
  };
}
