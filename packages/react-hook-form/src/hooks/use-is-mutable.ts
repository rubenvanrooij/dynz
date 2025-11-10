import { useConditionalProperty } from "./use-conditional-property";

export function useIsMutable(name: string) {
  return useConditionalProperty(name, "mutable");
}
