import { memo, type ReactNode } from "react";
import { useIsIncluded } from "../hooks";

type IsIncludedProps = {
  name: string;
  children?: ReactNode;
};

export const IsIncluded = memo(({ name, children }: IsIncludedProps) => {
  const isIncluded = useIsIncluded(name);
  return isIncluded ? children : null;
})

IsIncluded.displayName = 'IsIncluded'
