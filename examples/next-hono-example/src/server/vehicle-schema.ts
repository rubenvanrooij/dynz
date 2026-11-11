import {
  and,
  array,
  boolean,
  date,
  eq,
  expr,
  gte,
  isIn,
  matches,
  neq,
  number,
  object,
  options,
  or,
  ref,
  resource,
  resourceRef,
  string,
} from "dynz";

export type Eligibility = "eligible" | "referral" | "declined";

/**
 * What the registry knows about a plate. Type-level only: it never travels in the schema.
 * Eligibility is folded in: it is keyed by the vin, which only the registry knows, and
 * resources are evaluated in a single pass.
 */
export type Vehicle = {
  make: string;
  model: string;
  year: number;
  vin: string;
  eligibility: Eligibility;
};

export type Claims = { claimFreeYears: number };

export type PaymentOptions = { methods: string[] };

/** e.g. `AB-123-C`, `12-ABC-3`. Shared by the field's rule and the resource's `enabled`. */
export const PLATE_PATTERN = "^[A-Z0-9]{1,3}-[A-Z0-9]{2,3}-[A-Z0-9]{1,2}$";

/** A driving licence number: ten digits. */
export const LICENCE_PATTERN = "^[0-9]{10}$";

/** All-risk only covers cars from this year on. */
export const ALL_RISK_MIN_YEAR = 2018;

/**
 * What a resolver answers when its lookup still fails after a retry: behave like
 * `not_found`, but flagged. The browser and the server fall back the same way, so a failed
 * lookup never blocks the user.
 */
export const FALLBACK_STATES = {
  vehicle: { outcome: "unverified" },
  claims: { outcome: "to_verify" },
  driverClaims: { outcome: "to_verify" },
  paymentOptions: { outcome: "fallback" },
} as const;

const HAS_CAR = eq(ref("$.ownership"), "existing");
const FOUND = eq(resourceRef("vehicle.outcome"), "found");
const ELIGIBILITY = resourceRef("vehicle.data.eligibility");

/** The vehicle details are typed in: a new car, or a plate the registry didn't confirm. */
export const MANUAL_VEHICLE = or(
  eq(ref("$.ownership"), "new"),
  eq(resourceRef("vehicle.outcome"), "not_found"),
  eq(resourceRef("vehicle.outcome"), "unverified")
);

/** Declined stops the flow: nothing after the vehicle is asked. */
export const NOT_DECLINED = neq(ELIGIBILITY, "declined");

/** Manual vehicles have no vin, so they are a referral by rule, without a lookup. */
export const QUOTE_ONLY = or(MANUAL_VEHICLE, eq(ELIGIBILITY, "referral"));

export const ALL_RISK = or(
  // FOUND,
  // eq(ELIGIBILITY, "eligible"),
  gte(resourceRef("vehicle.data.year"), ALL_RISK_MIN_YEAR),
  gte(ref("$.manualVehicle.year"), ALL_RISK_MIN_YEAR)
);

const NO_CLAIMS_RECORD = or(
  eq(resourceRef("claims.outcome"), "not_found"),
  eq(resourceRef("claims.outcome"), "to_verify")
);

/**
 * The additional driver's own lookup. A separate name from the policyholder's `claims`:
 * a reference walks up to the nearest resource with its name, so while a driver's lookup
 * isn't enabled yet, `claims` would find the policyholder's outcome instead.
 */
const NO_DRIVER_CLAIMS_RECORD = or(
  eq(resourceRef("driverClaims.outcome"), "not_found"),
  eq(resourceRef("driverClaims.outcome"), "to_verify")
);

/** A payment method, offered when the payment provider offers it for the driver's country. */
const offered = (method: string) => ({
  value: method,
  enabled: isIn(method, resourceRef("paymentOptions.data.methods")),
});

/**
 * A car-insurance application whose shape depends on *external data*.
 *
 * | Step          | Fields                                       | Resource                                      |
 * | ------------- | -------------------------------------------- | --------------------------------------------- |
 * | 1 Start       | `ownership`                                  |                                               |
 * | 2 Vehicle     | `plate`, `vehicleConfirmed`, `manualVehicle` | `vehicle`, by plate                           |
 * | 3 Eligibility | none: `vehicle.data.eligibility`             |                                               |
 * | 4 Driver      | `driver.*`                                   | `claims`, by licence number                   |
 * |               | `additionalDrivers[].*`                      | `driverClaims`, per driver, by licence number |
 * | 5 Coverage    | `coverage`, `roadsideAssistance`             |                                               |
 * | 6 Payment     | `paymentMethod`                              | `paymentOptions`, by country                  |
 *
 * Resources are never part of the submitted values: the browser and the server each look
 * them up themselves, so a client cannot claim "found" or "eligible".
 */
export const vehicleSchema = object({
  ownership: options(["existing", "new"]),

  plate: string().regex(PLATE_PATTERN, "i", "invalid_plate").setIncluded(HAS_CAR),
  vehicleConfirmed: boolean().equals(true, "not_confirmed").setIncluded(and(FOUND, NOT_DECLINED)),
  manualVehicle: object({
    make: string().min(2),
    model: string().min(1),
    year: number().min(1950),
  }).setIncluded(MANUAL_VEHICLE),

  // derived, output-only flags
  vehicleUnverified: expr(eq(resourceRef("vehicle.outcome"), "unverified")),
  quoteOnly: expr(QUOTE_ONLY),

  driver: object({
    name: string().min(2),
    birthDate: date().setCoerce(true),
    licenceNumber: string().regex(LICENCE_PATTERN, "", "invalid_licence"),
    licenceDate: date().setCoerce(true),
    address: object({
      street: string().min(2),
      postcode: string().min(4),
      city: string().min(2),
    }),
    country: options(["NL", "BE", "DE", "FR"]),
    claimFreeYears: number().min(0).setIncluded(NO_CLAIMS_RECORD),
    previousInsurer: string().min(2).setIncluded(NO_CLAIMS_RECORD),
    selfDeclared: expr(eq(resourceRef("claims.outcome"), "not_found")),
    toBeVerified: expr(eq(resourceRef("claims.outcome"), "to_verify")),
  }).setIncluded(NOT_DECLINED),

  // every other driver of the car, each with their own claims lookup by licence number
  additionalDrivers: array(
    object({
      name: string().min(2),
      licenceNumber: string().regex(LICENCE_PATTERN, "", "invalid_licence"),
      claimFreeYears: number().min(0).setIncluded(NO_DRIVER_CLAIMS_RECORD),
    }).setResources({
      driverClaims: resource<Claims>({
        // bare references resolve from the object declaring the resource: this driver
        key: ref("licenceNumber"),
        enabled: matches(ref("licenceNumber"), LICENCE_PATTERN),
        outcomes: ["found", "not_found", "to_verify"],
      }),
    })
  )
    .max(3)
    .setIncluded(NOT_DECLINED),

  coverage: options(["third_party", "limited_casco", { value: "all_risk", enabled: ALL_RISK }]).setIncluded(
    NOT_DECLINED
  ),
  roadsideAssistance: boolean().optional().setIncluded(NOT_DECLINED),

  paymentMethod: options([
    offered("ideal"),
    offered("bancontact"),
    offered("sepa"),
    offered("card"),
    // the safe default: offered once the lookup is done, also when it failed
    {
      value: "invoice",
      enabled: or(
        eq(resourceRef("paymentOptions.outcome"), "available"),
        eq(resourceRef("paymentOptions.outcome"), "fallback")
      ),
    },
  ]).setIncluded(NOT_DECLINED),
}).setResources({
  vehicle: resource<Vehicle>({
    // bare references resolve from the object declaring the resource: the root here
    key: ref("plate"),
    // only a well-formed plate is worth a lookup; a half-typed one never leaves the browser
    enabled: and(HAS_CAR, matches(ref("plate"), PLATE_PATTERN, "i")),
    outcomes: ["found", "not_found", "unverified"],
  }),
  claims: resource<Claims>({
    key: ref("driver.licenceNumber"),
    enabled: and(NOT_DECLINED, matches(ref("driver.licenceNumber"), LICENCE_PATTERN)),
    outcomes: ["found", "not_found", "to_verify"],
  }),
  paymentOptions: resource<PaymentOptions>({
    key: ref("driver.country"),
    enabled: NOT_DECLINED,
    outcomes: ["available", "fallback"],
  }),
});
