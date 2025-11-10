import type { Condition } from "dynz";
import type { ReactNode } from "react";
import { useCondition } from "../hooks/use-condition";

export type WhenProps = {
  cond: Condition;
  children?: ReactNode;
};

export function When({ cond, children }: WhenProps) {
  const result = useCondition(cond);
  return result ? children : null;
}
