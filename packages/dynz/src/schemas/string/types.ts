import type { Rule } from "../../rules";

import type { BaseSchema, PrivateSchema, SchemaType } from "../../types";

export type StringSchema = BaseSchema<string, typeof SchemaType.STRING, Rule[]> &
  PrivateSchema & { coerce?: boolean | undefined };
