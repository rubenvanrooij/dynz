import { ageTransformer, ageTransformerType } from "./age-transformer";
import { ceilTransformer, ceilTransformerType } from "./ceil-transformer";
import { cosTransformer, cosTransformerType } from "./cos-transformer";
import { divideTransformer, divideTransformerType } from "./divide-transformer";
import { floorTransformer, floorTransformerType } from "./floor-transformer";
import { multiplyTransformer, multiplyTransformerType } from "./multiply-transformer";
import { sinTransformer, sinTransformerType } from "./sin-transformer";
import { sizeTransformer, sizeTransformerType } from "./size-transformer";
import { subTransformer, subTransformerType } from "./sub-tranformer";
import { sumTransformer, sumTransformerType } from "./sum-transformer";
import { tanTransformer, tanTransformerType } from "./tan-transformer";

export const TRANSFORMERS = {
  [ceilTransformerType]: ceilTransformer,
  [cosTransformerType]: cosTransformer,
  [floorTransformerType]: floorTransformer,
  [sinTransformerType]: sinTransformer,
  [sizeTransformerType]: sizeTransformer,
  [tanTransformerType]: tanTransformer,
  [sumTransformerType]: sumTransformer,
  [divideTransformerType]: divideTransformer,
  [ageTransformerType]: ageTransformer,
  [subTransformerType]: subTransformer,
  [multiplyTransformerType]: multiplyTransformer,
} as const;
