import { validate, type Schema, type SchemaValues, type ValidateOptions, type ValidationResult } from "dynz";
import type { FunnelStep } from "./types";

/** Validates a single step's raw input against its own schema, via dynz's `validate()`. */
export function validateStep<T extends Schema>(
  step: FunnelStep<T>,
  currentValues: SchemaValues<T> | undefined,
  newValues: unknown,
  options?: ValidateOptions
): Promise<ValidationResult<SchemaValues<T>>> {
  return validate(step.schema, currentValues, newValues, options);
}

export async function isStepValid<T extends Schema>(
  step: FunnelStep<T>,
  currentValues: SchemaValues<T> | undefined,
  newValues: unknown,
  options?: ValidateOptions
): Promise<boolean> {
  const result = await validateStep(step, currentValues, newValues, options);
  return result.success;
}
