import { useConditionalProperty } from "./use-conditional-property";

export function useIsRequired(name: string): boolean | undefined;
export function useIsRequired(names: string[]): (boolean | undefined)[];
export function useIsRequired(name: string | string[]) {
  return useConditionalProperty(name, "required");
}
