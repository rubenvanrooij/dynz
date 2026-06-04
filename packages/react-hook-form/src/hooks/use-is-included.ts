import { useConditionalProperty } from "./use-conditional-property";

export function useIsIncluded(name: string): boolean | undefined;
export function useIsIncluded(names: string[]): (boolean | undefined)[];
export function useIsIncluded(name: string | string[]) {
  return useConditionalProperty(name, "included");
}
