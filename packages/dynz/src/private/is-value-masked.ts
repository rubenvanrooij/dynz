import type { Schema } from "../types";
import { getPrivateData } from "./get-private-data";

export function isValueMasked<T extends Schema>(schema: T, value: unknown): boolean {
  if (schema.private === true) {
    return getPrivateData(value).state === "masked";
  }

  return false;
}
