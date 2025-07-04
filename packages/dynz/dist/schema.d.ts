import { ArraySchema, NumberSchema, ObjectSchema, Schema, DateStringSchema, StringSchema, Rule, Optional } from './types';
export declare function string(): StringSchema;
export declare function string<T extends Omit<StringSchema, 'type'>>(value: T): T & Pick<StringSchema, 'type'>;
export declare const object: <T extends Record<string, Schema>, A extends Omit<ObjectSchema<T>, "type">>(value: A) => A & Pick<ObjectSchema<T>, "type">;
export declare const DEFAULT_DATE_STRING_FORMAT = "yyyy-MM-dd";
export declare function dateString(): DateStringSchema;
export declare function dateString<T extends string, A extends Optional<Omit<DateStringSchema<T>, 'type'>, 'format'>>(value: A): A & Pick<DateStringSchema<T>, 'format'> & Pick<DateStringSchema<T>, 'type'>;
export declare const number: <A extends Omit<NumberSchema, "type">>(value: A) => A & Pick<NumberSchema, "type">;
export declare const array: <const T extends Schema, A extends Omit<ArraySchema<T>, "type">>(value: A) => A & Pick<ArraySchema<T>, "type">;
export declare function optional<T extends Schema>(schema: T): T & {
    required: false;
};
export declare function required<T extends Schema>(schema: T): T & {
    required: true;
};
export declare function rules<T extends Schema, A extends Rule>(schema: T, ...rules: A[]): T & {
    rules: A[];
};
//# sourceMappingURL=schema.d.ts.map