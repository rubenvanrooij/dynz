import type { Predicate } from "dynz";
import type { ReactNode } from "react";
import { usePredicate } from "../hooks/use-predicate";

export type WhenProps = {
  cond: Predicate;
  children?: ReactNode;
};

export function When({ cond, children }: WhenProps) {
  const result = usePredicate(cond);
  return result ? children : null;
}
