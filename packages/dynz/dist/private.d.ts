import { MaskedPrivateValue, PlainPrivateValue } from './types';
export declare function plain<A extends string | number>(value?: A): PlainPrivateValue<A>;
export declare function mask<const T extends PlainPrivateValue<A>, const A extends string | number>(value?: T | A, maskFn?: (value?: A) => string): MaskedPrivateValue;
//# sourceMappingURL=private.d.ts.map