import { assertString, isObject } from "../validate";
import type { PrivateValue } from "./types";

export function getPrivateData(value: unknown): PrivateValue<unknown> {
  if (value === undefined) {
    throw new Error(
      `'undefined' was passed where a private value was expected; if a private value is not required it must still adhere to the following structure: { type: 'masked' | 'plain', value: undefined }. This is the only way that tracking changes is possible`
    );
  }

  if (!isObject(value) || (value.state !== "plain" && value.state !== "masked")) {
    throw new Error(`value does not represent a masked value: ${value}`);
  }

  if (value.state === "masked") {
    return {
      state: "masked",
      value: assertString(value.value),
    };
  }

  return {
    state: value.state,
    value: value.value,
  };
}
