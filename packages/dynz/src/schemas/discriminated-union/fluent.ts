import type { Predicate } from "../../functions";
import type { JsonRecord, Schema } from "../../types";
import { SchemaType } from "../../types";
import type { DynamicOptionValue } from "../options/types";
import {
  type CheckMember,
  type DiscriminatedUnionSchema,
  DISCRIMINATOR_TYPE,
  type Discriminator,
  type NormalizeMember,
} from "./types";

type SchemaMember = Record<string, Schema | Discriminator>;

type NormalizeMembers<TKey extends string, TSchemas> = {
  [I in keyof TSchemas]: NormalizeMember<TKey, TSchemas[I]>;
};

/**
 * Normalizes an authoring-time discriminator value (a raw primitive or a `DynamicOptionValue`,
 * exactly like an `options()` value) into the stored `Discriminator` shape.
 */
function normalizeDiscriminatorEntry(raw: string | number | boolean | DynamicOptionValue): Discriminator {
  if (typeof raw === "object") {
    return { type: DISCRIMINATOR_TYPE, value: raw.value, enabled: raw.enabled };
  }

  return { type: DISCRIMINATOR_TYPE, value: raw };
}

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
>(
  key: TKey,
  schemas: TSchemas
): DiscriminatedUnionFluent<TKey, NormalizeMembers<TKey, TSchemas> & SchemaMember[], Record<never, never>> {
  const normalizedSchemas = (schemas as unknown as Record<string, unknown>[]).map((member) => ({
    ...member,
    [key]: normalizeDiscriminatorEntry(member[key] as string | number | boolean | DynamicOptionValue),
  }));

  return createFluent(
    key,
    normalizedSchemas as NormalizeMembers<TKey, TSchemas> & SchemaMember[],
    {} as Record<never, never>
  );
}
