import { useConditionalProperty } from "./use-conditional-property";

export function useIsRequired(name: string) {
  return useConditionalProperty(name, "required");
}
