import type { Predicate } from "../../functions";
import type { JsonRecord, Schema } from "../../types";
import { SchemaType } from "../../types";
import type { CheckMember, DiscriminatedUnionSchema } from "./types";

type SchemaMember = Record<string, Schema | string | number | boolean>;

export type DiscriminatedUnionFluent<
  TKey extends string,
  TSchemas extends SchemaMember[],
  TProps,
> = DiscriminatedUnionSchema<TKey, TSchemas> &
  TProps & {
    setRequired: <P extends boolean | Predicate>(
      value: P
    ) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { required: P }>;
    optional: () => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { required: false }>;
    setMutable: <P extends boolean | Predicate>(
      value: P
    ) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { mutable: P }>;
    setIncluded: <P extends boolean | Predicate>(
      value: P
    ) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { included: P }>;
    setPrivate: <P extends boolean>(value: P) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { private: P }>;
    setUi: <TUI extends JsonRecord>(config: TUI) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { ui: TUI }>;
  };

function createFluent<TKey extends string, TMembers extends SchemaMember[], TProps>(
  key: TKey,
  schemas: TMembers,
  props: TProps
): DiscriminatedUnionFluent<TKey, TMembers, TProps> {
  const setProp = <K extends string, V>(k: K, v: V): DiscriminatedUnionFluent<TKey, TMembers, TProps & Record<K, V>> =>
    createFluent(key, schemas, { ...props, [k]: v } as TProps & Record<K, V>);

  return {
    type: SchemaType.DISCRIMINATED_UNION,
    key,
    schemas,
    ...props,
    setRequired: <P extends boolean | Predicate>(v: P) => setProp("required", v),
    optional: () => setProp("required", false as false),
    setMutable: <P extends boolean | Predicate>(v: P) => setProp("mutable", v),
    setIncluded: <P extends boolean | Predicate>(v: P) => setProp("included", v),
    setPrivate: <P extends boolean>(v: P) => setProp("private", v),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as DiscriminatedUnionFluent<TKey, TMembers, TProps>;
}

export function discriminatedUnion<
  const TKey extends string,
  const TSchemas extends { [I in keyof TSchemas]: CheckMember<TKey, TSchemas[I]> },
>(key: TKey, schemas: TSchemas): DiscriminatedUnionFluent<TKey, TSchemas & SchemaMember[], Record<never, never>> {
  return createFluent(key, schemas as TSchemas & SchemaMember[], {} as Record<never, never>);
}
