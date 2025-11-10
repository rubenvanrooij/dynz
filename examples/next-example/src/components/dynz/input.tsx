import { IsIncluded, useDynzFormContext, useIsMutable } from "@dynz/react-hook-form";
import { useTranslations } from "next-intl";
import { FormControl, FormDescription, FormField, FormItem, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { DynzFormLabel } from "./dynz-form";

export type DynzInputProps = {
  name: string;
  i18nPath: string;
} & Pick<React.ComponentProps<"input">, "type">;

export function DynzInput({ name, i18nPath, ...props }: DynzInputProps) {
  const { control, dependencies } = useDynzFormContext();
  const deps = dependencies.reverse[`$.${name}`];
  const t = useTranslations();
  const isMutable = useIsMutable(name);

  return (
    <IsIncluded name={name}>
      <FormField
        control={control}
        name={name}
        rules={{
          deps: deps ? [...deps].map((v) => v.slice(2)) : undefined,
        }}
        render={({ field }) => (
          <FormItem>
            <DynzFormLabel i18nPath={i18nPath} name={name} />
            <FormControl>
              <Input
                placeholder={t(`${i18nPath}.${name}.placeholder`)}
                {...props}
                {...field}
                readOnly={isMutable === false}
              />
            </FormControl>
            {t.has(`${i18nPath}.${name}.description`) && (
              <FormDescription>{`${i18nPath}.${name}.description`}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </IsIncluded>
  );
}
