import { useConditionalProperty } from "./use-conditional-property";

export function useIsIncluded(name: string) {
  return useConditionalProperty(name, "included");
}
