import { Schema, Context, ValueOrCondition, ValueOrRef, ResolvedRules } from './types';
export declare function isRequired(schema: Schema, path: string, context: Context): boolean;
export declare function isIncluded(schema: Schema, path: string, context: Context): boolean;
export declare function isMutable(schema: Schema, path: string, context: Context): boolean;
export declare function resolveRules(schema: Schema, path: string, context: Context): ResolvedRules[];
export declare function resolveValueOrCondition(valueOrCondition: ValueOrCondition<boolean>, path: string, context: Context): boolean;
export declare function unpackRef<T>(valueOrRef: ValueOrRef<T>, path: string, context: Context): T | unknown;
//# sourceMappingURL=resolve.d.ts.map