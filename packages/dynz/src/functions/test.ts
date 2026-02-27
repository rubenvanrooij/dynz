import { isIn } from "../conditions";
import { ref } from "../reference";
import { gte, multiply, v } from "./builder";

const _fsoo = gte(v(5), multiply(ref("pricePerItem"), v(3)));

isIn("foo", ["foo", "bar"]);
