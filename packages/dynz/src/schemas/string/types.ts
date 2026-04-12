import type { Rule } from "../../rules";

import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type StringSchema<TRule extends Rule[] | undefined = Rule[] | undefined> = BaseSchema<
  string,
  typeof SchemaType.STRING,
  TRule
> &
  PrivateSchema & { coerce?: boolean | undefined };
