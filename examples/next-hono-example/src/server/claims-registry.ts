import type { ResourceState } from "dynz";
import { latency, RegistryUnavailableError } from "./vehicle-registry";
import type { Claims } from "./vehicle-schema";

/** A stand-in for the claims history register, by driving licence number. */
const CLAIMS: Record<string, Claims> = {
  "1234567890": { claimFreeYears: 7 },
  "1111111111": { claimFreeYears: 2 },
};

/** Looking this licence up fails. */
export const UNREACHABLE_LICENCE = "0000000000";

/** @throws {RegistryUnavailableError} when the register can't be reached */
export async function lookupClaims(licence: string): Promise<ResourceState<Claims, "found" | "not_found">> {
  await latency();

  if (licence === UNREACHABLE_LICENCE) {
    throw new RegistryUnavailableError(`The claims register could not be reached for ${licence}`);
  }

  const claims = CLAIMS[licence];

  return claims ? { outcome: "found", data: claims } : { outcome: "not_found" };
}

export const KNOWN_LICENCES = Object.keys(CLAIMS);
