import { Context, ResolvedSchema, Schema, ValueOrRef } from './types';
export declare function resolve<T extends Schema>(schema: T, values: unknown): ResolvedSchema<T>;
export declare function assertNumber(value: unknown): number;
export declare function assertString(value: unknown): string;
export declare function unpackRef<T>(valueOrRef: ValueOrRef<T>, schema: Schema | ResolvedSchema, value: unknown, context: Context): T | unknown;
//# sourceMappingURL=resolve.d.ts.map