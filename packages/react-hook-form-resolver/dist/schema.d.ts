import { ArraySchema, NumberSchema, ObjectSchema, Schema, DateStringSchema, StringSchema } from './types';
export declare const string: <A extends Omit<StringSchema, "type">>(value: A) => A & Pick<StringSchema, "type">;
export declare const dateString: <A extends Omit<DateStringSchema, "type">>(value: A) => A & Pick<DateStringSchema, "type">;
export declare const object: <T extends Record<string, Schema>, A extends Omit<ObjectSchema<T>, "type">>(value: A) => A & Pick<ObjectSchema<T>, "type">;
export declare const number: <A extends Omit<NumberSchema, "type">>(value: A) => A & Pick<NumberSchema, "type">;
export declare const array: <T extends Schema, A extends Omit<ArraySchema<T>, "type">>(value: A) => A & Pick<ArraySchema<T>, "type">;
//# sourceMappingURL=schema.d.ts.map