import * as d from "./builder";

const foo = d.gte(d._(5), d.multiply(d.ref("pricePerItem"), d.ref("quantity")));
