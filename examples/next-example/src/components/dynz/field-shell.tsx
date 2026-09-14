import type { ReactNode } from "react";
import { FormDescription, FormItem, FormLabel, FormMessage } from "../ui/form";

export type DynzFieldShellProps = {
  label?: string;
  required?: boolean;
  description?: string;
  children: ReactNode;
};

export function DynzFieldShell({ label, required, description, children }: DynzFieldShellProps) {
  return (
    <FormItem>
      <FormLabel>
        {label}
        {required && " *"}
      </FormLabel>
      {children}
      {description && <FormDescription>{description}</FormDescription>}
      <FormMessage />
    </FormItem>
  );
}
