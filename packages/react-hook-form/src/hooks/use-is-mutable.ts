import { useConditionalProperty } from "./use-conditional-property";

export function useIsMutable(name: string): boolean | undefined;
export function useIsMutable(names: string[]): (boolean | undefined)[];
export function useIsMutable(name: string | string[]) {
  return useConditionalProperty(name, "mutable");
}
