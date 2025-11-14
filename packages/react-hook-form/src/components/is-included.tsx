import type { ReactNode } from "react";
import { useIsIncluded } from "../hooks";

type IsIncludedProps = {
  name: string;
  children?: ReactNode;
};

export function IsIncluded({ name, children }: IsIncludedProps) {
  const isIncluded = useIsIncluded(name);
  return isIncluded ? children : null;
}
