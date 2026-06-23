import type { Predicate } from "../../functions";
import type { JsonRecord } from "../../types";
import { SchemaType } from "../../types";
import type { DiscriminatedUnionSchema, ObjectSchemaWithDiscriminator } from "./types";

export type DiscriminatedUnionFluent<
  TKey extends string,
  TSchemas extends ObjectSchemaWithDiscriminator<TKey>[],
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

function createFluent<TKey extends string, TMembers extends ObjectSchemaWithDiscriminator<TKey>[], TProps>(
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
  const TSchemas extends ObjectSchemaWithDiscriminator<TKey>[],
>(key: TKey, schemas: TSchemas): DiscriminatedUnionFluent<TKey, TSchemas, Record<never, never>> {
  return createFluent(key, schemas, {} as Record<never, never>);
}
