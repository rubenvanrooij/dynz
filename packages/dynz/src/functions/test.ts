import { ref } from "../reference";
import { gte, multiply, val } from "./builder";

const fsoo = gte(val(5), multiply(ref("pricePerItem"), val(3)));
