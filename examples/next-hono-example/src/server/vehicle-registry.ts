import type { ResourceState } from "dynz";
import type { Vehicle } from "./vehicle-schema";

/** A bit of latency, so the pending state is visible in the browser. */
export const latency = () => new Promise((resolve) => setTimeout(resolve, 800));

/** A stand-in for a real vehicle registry. */
const REGISTRY: Record<string, Vehicle> = {
  "AB-123-C": { make: "Volkswagen", model: "Golf", year: 2019, vin: "WVWZZZ1KZ9W000001", eligibility: "eligible" },
  "XK-55-PL": { make: "Tesla", model: "Model 3", year: 2022, vin: "5YJ3E7EA1NF000002", eligibility: "eligible" },
  "12-ABC-3": { make: "Volvo", model: "V60", year: 2017, vin: "YV1FW00000H000003", eligibility: "referral" },
  "DE-666-C": { make: "Dodge", model: "Viper", year: 2008, vin: "1B3JZ65Z08V000004", eligibility: "declined" },
};

/** Looking this plate up fails, to show what happens when a lookup can't be completed. */
export const UNREACHABLE_PLATE = "ER-404-X";

export class RegistryUnavailableError extends Error {}

/**
 * Looks a plate up. Eligibility comes along: it is decided by the vin.
 *
 * @throws {RegistryUnavailableError} when the registry can't be reached
 */
export async function lookupVehicle(plate: string): Promise<ResourceState<Vehicle, "found" | "not_found">> {
  await latency();

  const normalized = plate.toUpperCase();

  if (normalized === UNREACHABLE_PLATE) {
    throw new RegistryUnavailableError(`The vehicle registry could not be reached for ${normalized}`);
  }

  const vehicle = REGISTRY[normalized];

  return vehicle ? { outcome: "found", data: vehicle } : { outcome: "not_found" };
}

export const KNOWN_PLATES = Object.keys(REGISTRY);
