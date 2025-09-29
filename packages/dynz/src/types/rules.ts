import type { ConditionalRule } from "../rules";
import type { Schema } from "./schema";
import type { Unpacked } from "./utils";
import type { BaseErrorMessage, OmitBaseErrorMessageProps, ValidateRuleContext } from "./validate";

export type BaseRule = {
  type: string;
  code?: string | undefined;
};

export type ExtractRules<T extends Schema> = Unpacked<Exclude<T["rules"], undefined>>;

export type ResolvedRules<TSchema extends Schema, T extends ExtractRules<TSchema> = ExtractRules<TSchema>> = Exclude<
  T,
  ConditionalRule<never, never>
>;

export type ExtractResolvedRules<T extends Schema> = ResolvedRules<T, ExtractRules<T>>;

export type RuleFn<T extends Schema, R extends ExtractResolvedRules<T>, E extends BaseErrorMessage> = (
  context: Omit<ValidateRuleContext<T, R>, "type" | "ruleType">
) => OmitBaseErrorMessageProps<E> | undefined;
