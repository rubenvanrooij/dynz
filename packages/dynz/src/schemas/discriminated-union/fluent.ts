import type { Predicate } from "../../functions";
import type { DiscriminatedMemberValue, JsonRecord, Schema } from "../../types";
import { SchemaType } from "../../types";
import type { CheckMember, DiscriminatedUnionSchema } from "./types";

type SchemaMember = Record<string, Schema | string | number | boolean>;

/**
 * The value type for a discriminated union's own `.setDefault(...)`: the discriminator
 * key is required — it's what picks which member applies, so there's no way to make
 * sense of a default without it — but every other field is optional, matching
 * object()'s partial-default story. A member field with its own `.setDefault(...)`
 * doesn't need to be repeated here.
 */
type DiscriminatedUnionDefaultValue<TKey extends string, TMember extends SchemaMember> = TMember extends SchemaMember
  ? // `Extract<keyof ..., TKey>`, not `TKey` directly, as the Pick key set: TypeScript
    // can't prove a generic TKey satisfies `keyof DiscriminatedMemberValue<TKey, TMember>`
    // on its own, even though it always does for any real instantiation — Extract sidesteps
    // that by only ever picking keys it can already see are present.
    Pick<DiscriminatedMemberValue<TKey, TMember>, Extract<keyof DiscriminatedMemberValue<TKey, TMember>, TKey>> &
      Partial<Omit<DiscriminatedMemberValue<TKey, TMember>, TKey>>
  : never;

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
    /**
     * Sets a default value used whenever the union itself is left empty. The
     * discriminator must be set — it's what picks which member applies — but every
     * other field may be omitted and falls back to that field's own default, the
     * same way object()'s composite defaults compose.
     *
     * @param value - Default value; the discriminator key is required, everything else optional.
     */
    setDefault: <V extends DiscriminatedUnionDefaultValue<TKey, TSchemas[number]>>(
      value: V
    ) => DiscriminatedUnionFluent<TKey, TSchemas, TProps & { default: V }>;
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
    setDefault: <V extends DiscriminatedUnionDefaultValue<TKey, TMembers[number]>>(v: V) => setProp("default", v),
    setUi: <TUI extends JsonRecord>(config: TUI) => setProp("ui", config),
  } as DiscriminatedUnionFluent<TKey, TMembers, TProps>;
}

export function discriminatedUnion<
  const TKey extends string,
  const TSchemas extends { [I in keyof TSchemas]: CheckMember<TKey, TSchemas[I]> },
>(key: TKey, schemas: TSchemas): DiscriminatedUnionFluent<TKey, TSchemas & SchemaMember[], Record<never, never>> {
  return createFluent(key, schemas as TSchemas & SchemaMember[], {} as Record<never, never>);
}
