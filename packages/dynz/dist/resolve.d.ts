import { Condition, Schema, ValueOrRef, ResolvedRules, Reference } from './types';
type ResolveContext = {
    schema: Schema;
    values: {
        new: unknown;
    };
};
export declare function isRequired<T extends Schema>(schema: T, path: string, values: unknown): boolean;
export declare function isIncluded<T extends Schema>(schema: T, path: string, values: unknown): boolean;
export declare function isMutable<T extends Schema>(schema: T, path: string, values: unknown): boolean;
/**
 * Resolves one of the following properties: required, mutable, included on a
 * schema
 */
export declare function resolveProperty<T extends Schema>(schema: T, property: 'required' | 'mutable' | 'included', path: string, defaultValue: boolean, context: ResolveContext): boolean;
export declare function resolveCondition(condition: Condition, path: string, context: ResolveContext): boolean;
export declare function resolveRules(schema: Schema, path: string, context: ResolveContext): ResolvedRules[];
export declare function isReference(value: unknown): value is Reference;
export declare function unpackRefValue(valueOrRef: ValueOrRef, path: string, context: ResolveContext): unknown;
export declare function unpackRef(valueOrRef: ValueOrRef, path: string, context: ResolveContext): {
    value: unknown;
    static: true;
} | {
    schema: Schema;
    value: unknown;
    static: false;
};
export declare function findSchemaByPath<T extends Schema, A extends Schema>(path: string, schema: T, type?: A['type']): Schema;
export declare function getNested<T extends Schema>(path: string, schema: T, value: unknown): {
    schema: Schema;
    value: unknown;
};
export {};
//# sourceMappingURL=resolve.d.ts.map