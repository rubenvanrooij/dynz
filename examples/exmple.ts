import * as d from "dynz";

/**
 * A single dynz schema for the car insurance funnel: licence-plate lookup and
 * premium quote, coverage selection, becoming a customer (incl. acceptance
 * questions, switching and payment), and the post-submission acceptance
 * outcome. One schema drives every step; later steps unlock via
 * `progress.*` flags and re-derive automatically (via `ref`/`expr`) whenever
 * an earlier answer changes.
 */

const now = new Date();
const oldestAllowedBirthDate = new Date(now.getFullYear() - 85, now.getMonth(), now.getDate());
const youngestAllowedBirthDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
const latestPolicyStartDate = new Date(now.getFullYear(), now.getMonth() + 12, now.getDate());

// 
Background: i'm building a serializable schema validor; think Zod, but then your schema can be fully serialized, send to the FE and based on that you can build a form, chat, voice, whatever experience
I'm not facing the following design challenge:
I have a field called licensePlate when it is filled in and the API call to `valid-license-plate` returns
a 404(not found) I want that the user MUST manually fill in their car data.The pattern is as follows:
- field with a async validation
  - if validation returns a specific result -> a side effect must happen
I am very proud that the schema is PURE in itself and doesnt allow ANY form of sideffects to happen
this is an important design decision which CANNOT be broken.Based on this how would you design a schema that allows for this pattern ?

  d.object({
    licensePlate: d.string().min(6),
    manualEntry: d.object({
      brand: d.string(),
    }).setIncluded(d.eq(d.context('vehicle.status'), 'not_found'))
  }).context({
    vehicle: d.resource('vehicleByPlate').input({
      plate: d.ref('licensePlate')
    }).when(d.isValid(d.ref('licensePlate')))
  })

The schema declares a vehicle context node that names a resolver and the input it needs, but never performs the lookup itself — the host binds 'vehicleByPlate' to an actual HTTP call, so the schema stays pure data that serializes to JSON.Evaluation is a pure function of values plus known resource states: given $.vehicle.status, the engine computes whether manualEntry is included, and the runtime separately fires any requests the engine reports as outstanding.Because "the user must enter car data" is expressed as derived state rather than a triggered effect, it needs no special machinery — it's the same conditional-inclusion predicate you'd use for any other branch.The split between d.ref() for user - entered values and d.context() for looked - up facts keeps path resolution unambiguous and keeps manualEntry the only thing that reaches the parsed payload.And since every consumer — form, chat, voice, backend — runs the same evaluation against its own resolver bindings, the server can re - derive the requirement independently instead of trusting a client - supplied 404

// 1
d.object({
  licensePlate: d.string().min(6).custom("valid-license-plate"),
  customCarInput: d.object({
    brand: d.string()
  }).setIncluded(d.eq(d.custom("license-plate-exists", {
    licensePlate: d.ref('licensePlate') // now type validation and min rule fall under the custom function logic (again)
  }), false))
})

// -> customCarInput MUST only be included when licensePlate DOES NOT EXIST. 
// complexity here is that customCarInput (depends on) licensePlate, but schemas
// now cannot declare that dependency
d.object({
  licensePlate: d.string().min(6).custom("valid-license-plate"),
  customCarInptu: d.lazy(
    ['licensePlate'],
    d.object({
      brand: d.string()
    }).setIncluded(d.eq(d.custom("license-plate-exists", {
      licensePlate: d.context('licensePlate') // now type validation and min rule fall under the custom function logic (again)
    }), false)))
})

// funnel based
xport const expenseClaimFunnel = defineFunnel({
  initial: "licensePlate",
  steps: [
    step("licensePlate", d.object({
      licensePlate: d.string().min(6).custom("valid-license-plate")
    }) {
      next: [
        // Cross-step in effect, but resolved here — not inside a field — against the
        // funnel's merged schema, so it can see this step's own just-submitted value.
        transition(
          "manualCarInput",
          d.eq(d.custom("license-plate-exists", { licensePlate: d.ref('licensePlate') })
          ),
          transition("polisDetails"),
      ],
    }),

    step("manualCarInput", d.object({
      brand: d.string()
    }), {
      next: [transition("polisDetails")],
    }),

    step(
      "polisDetails",
      d.object({
        ...
      })
      {
        next: [
          transition(null)
        ],
      }
    ),
  ],
});


export const carInsuranceFunnelSchema = d
  .object({
    car: d.object({
      licensePlate: d.string().custom("valid-license-plate").setRequired(true),
      // The one genuine user action here: confirming the resolved vehicle,
      // however it was resolved. Not fetched data — an explicit choice.
      confirmed: d.boolean().equals(true, "car_must_be_confirmed").setRequired(true).describe("Gebruiker heeft de getoonde auto bevestigd"),

      manualEntry: d.object({
        brand: d.string(),
        age: d.number(),
      }).setIncluded(
        d.eq(d.external("license-plate-not-found", { dependsOn: [d.ref("car.licensePlate")] }), false)
      )

      ageInYears: d
        .expr(d.external("vehicle.ageInYears", { dependsOn: [d.ref("car.licensePlate")] }))
        .describe("Leeftijd van de auto"),
      riskClass: d
        .expr(d.external("vehicle.riskClass", { dependsOn: [d.ref("car.licensePlate")] }))
        .describe("Risicoklasse o.b.v. gewicht en brandstoftype, bepaald door het rating-systeem"),
    }),

    driver: d.object({
      dateOfBirth: d
        .date()
        .min(oldestAllowedBirthDate, "driver_too_old")
        .max(youngestAllowedBirthDate, "driver_too_young")
        .setRequired(true)
        .describe("Geboortedatum; bestuurders onder de 18 of boven de maximumleeftijd worden geweigerd"),
      youngDriver: d
        .expr(d.lt(d.age(d.ref("driver.dateOfBirth")), 24))
        .describe("True wanneer de bestuurder jonger is dan 24 jaar; leidt tot een jongebestuurderstoeslag"),

      postcode: d
        .string()
        .regex("^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", undefined, "invalid_postcode_format")
        .setRequired(true)
        .describe("Postcode van de bestuurder; regionaal risico is een belangrijke premiefactor"),

      claimFreeYears: d
        .number()
        .min(0)
        .max(20)
        .setRequired(true)
        .describe("Schadevrije jaren; bepaalt de trede op de bonus-malusladder. Wordt later geverifieerd via Roy-data"),

      kmPerYear: d
        .options(["under_10000", "10000_to_15000", "15000_to_20000", "over_20000"])
        .setRequired(true)
        .describe("Kilometers per jaar (bandbreedte)"),

      isRegularDriver: d
        .boolean()
        .setDefault(true)
        .describe("False wanneer de polishouder niet de regelmatige bestuurder is; dan worden diens gegevens hieronder uitgevraagd"),

      regularDriver: d
        .object({
          dateOfBirth: d.date().min(oldestAllowedBirthDate, "driver_too_old").max(youngestAllowedBirthDate, "driver_too_young").setRequired(true),
          claimFreeYears: d.number().min(0).max(20).setRequired(true),
        })
        .setIncluded(d.eq(d.ref("driver.isRegularDriver"), false))
        .describe("Leeftijd en schadevrije jaren van de daadwerkelijke, regelmatige bestuurder"),
    }),

    premium: d
      .object({
        basePremium: d
          .expr(
            d.external("rating.basePremium", {
              dependsOn: [d.ref("product.coverage"), d.ref("car.riskClass"), d.ref("driver.postcode")],
            })
          )
          .describe("Basispremie o.b.v. dekking, risicoklasse auto en regio"),
        ageFactor: d
          .expr(
            d.external("rating.ageFactor", {
              dependsOn: [d.ref("driver.isRegularDriver"), d.ref("driver.dateOfBirth"), d.ref("driver.regularDriver.dateOfBirth")],
            })
          )
          .describe("Leeftijdsfactor o.b.v. leeftijd bestuurder"),
        kmFactor: d
          .expr(d.external("rating.kmFactor", { dependsOn: [d.ref("driver.kmPerYear")] }))
          .describe("Kilometerfactor o.b.v. kilometers per jaar"),
        bonusMalusPercentage: d
          .expr(
            d.external("rating.bonusMalusPercentage", {
              dependsOn: [d.ref("driver.isRegularDriver"), d.ref("driver.claimFreeYears"), d.ref("driver.regularDriver.claimFreeYears")],
            })
          )
          .describe("Percentage van de premie na de bonus-malus-trede (100 = geen korting, lager = meer korting)"),
        deductibleDiscount: d
          .expr(d.external("rating.deductibleDiscount", { dependsOn: [d.ref("product.deductible")] }))
          .describe("Korting (negatief) of toeslag (positief) voor het gekozen eigen risico"),
        addonsPremium: d
          .expr(d.external("rating.addonsPremium", { dependsOn: [d.ref("product.addons")] }))
          .describe("Som van de premies voor de gekozen aanvullende dekkingen"),

        premiumExclTax: d
          .expr(
            d.sum(
              d.multiply(
                d.ref("premium.basePremium"),
                d.ref("premium.ageFactor"),
                d.ref("premium.kmFactor"),
                d.divide(d.ref("premium.bonusMalusPercentage"), 100)
              ),
              d.ref("premium.deductibleDiscount"),
              d.ref("premium.addonsPremium")
            )
          )
          .describe("Premie exclusief assurantiebelasting"),
        premiumInclTax: d.expr(d.multiply(d.ref("premium.premiumExclTax"), 1.21)).describe("Premie inclusief 21% assurantiebelasting"),
      })
      .setDefault({})
      .describe("Premiequote; volledig extern berekend, dynz combineert de resultaten live tot een prijs"),

    // ------------------------------------------------------------------
    // 2. Product (choosing the coverage)
    // ------------------------------------------------------------------
    product: d
      .object({
        coverage: d
          .options([
            "wa",
            "wa_plus",
            // Allrisk is only eligible up to 8 years old; older cars only see WA/WA+.
            { value: "allrisk", enabled: d.lte(d.ref("car.ageInYears"), 8) },
          ])
          .setRequired(true)
          .setUi({
            recommendedCoverageByCarAge: { upTo3Years: "allrisk", upTo8Years: "wa_plus", olderThan8Years: "wa" },
          })
          .describe("WA (wettelijk verplicht), WA+ (beperkt casco) of Allrisk (volledig casco)"),

        deductible: d
          .options([150, 250, 500, 1000, 2500])
          .setRequired(true)
          .when(d.eq(d.ref("product.coverage"), "allrisk"), (b) => b.oneOf([d.v(500), d.v(1000), d.v(2500)]))
          .describe("Eigen risico; Allrisk kent een verplicht hoger minimum"),

        replacementValueScheme: d
          .boolean()
          .setDefault(false)
          .setIncluded(d.and(d.eq(d.ref("product.coverage"), "allrisk"), d.lte(d.ref("car.ageInYears"), 3)))
          .describe("Nieuwwaarde- of aanschafwaarderegeling; alleen voor de eerste jaren met Allrisk"),

        addons: d
          .array(
            d.options([
              "roadside_assistance_domestic",
              "roadside_assistance_europe",
              "passenger_insurance",
              "legal_assistance_traffic",
              // Only offered once the driver has built up a minimum number of claim-free years.
              { value: "no_claim_protector", enabled: d.gte(d.ref("driver.claimFreeYears"), 3) },
            ])
          )
          .max(5)
          .optional()
          .describe("Gekozen aanvullende dekkingen: pechhulp, schadeverzekering inzittenden, rechtsbijstand verkeer, no-claimbeschermer"),

        monthlyPremium: d.expr(d.divide(d.ref("premium.premiumInclTax"), 12)).describe("Premie per maand; werkt live bij elke keuze"),
      })
      .setIncluded(d.eq(d.ref("progress.carAndUsageCompleted"), true))
      .describe("Dekkingskeuze; pas bereikbaar nadat stap 'auto en gebruik' is afgerond"),

    // Explicit step-completion flags so later steps stay locked until
    // earlier ones are done, and so this schema can validate a
    // work-in-progress, partially saved quote.
    progress: d
      .object({
        carAndUsageCompleted: d.boolean().setDefault(false).describe("Gezet zodra alle verplichte auto- en gebruiksgegevens zijn ingevuld"),
        coverageSelected: d.boolean().setDefault(false).describe("Gezet zodra de gebruiker een dekking heeft gekozen"),
      })
      .setDefault({})
      .describe("Stap-status van de funnel; bepaalt welke vervolgstappen ontgrendeld zijn"),

    // ------------------------------------------------------------------
    // 3. Becoming a customer (klant worden)
    // ------------------------------------------------------------------
    customer: d
      .object({
        firstName: d.string().min(1).max(50).setRequired(true),
        lastName: d.string().min(1).max(50).setRequired(true),
        address: d.object({
          postcode: d.string().regex("^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", undefined, "invalid_postcode_format").setRequired(true),
          houseNumber: d.string().min(1).max(10).setRequired(true),
          houseNumberAddition: d.string().max(10).optional(),
          street: d.string().min(1).setRequired(true).describe("Automatisch ingevuld op basis van postcode en huisnummer"),
          city: d.string().min(1).setRequired(true).describe("Automatisch ingevuld op basis van postcode en huisnummer"),
        }),
        email: d.string().email().setRequired(true),
        phone: d.string().regex("^(\\+31[1-9][0-9]{8}|0[1-9][0-9]{8})$", undefined, "invalid_phone_format").setRequired(true),
        startDate: d.date().min(now, "start_date_in_past").max(latestPolicyStartDate, "start_date_too_far_ahead").setRequired(true),
      })
      .setIncluded(d.eq(d.ref("progress.coverageSelected"), true)),

    // Knock-out questions: any "yes" sends the application to manual review instead of straight-through issuance.
    acceptanceQuestions: d
      .object({
        hasInsuranceHistoryIssues: d.boolean().setRequired(true).describe("Eerdere problemen met verzekeringsgeschiedenis"),
        hasCriminalHistory: d.boolean().setRequired(true).describe("Strafrechtelijk verleden"),
        hasDrivingBan: d.boolean().setRequired(true).describe("Rijontzegging"),
        hasPreviousCancellation: d.boolean().setRequired(true).describe("Eerdere royementen door een verzekeraar"),
      })
      .setIncluded(d.eq(d.ref("progress.coverageSelected"), true))
      .describe("Slotvragen; een 'ja' leidt tot handmatige beoordeling in plaats van een online polis"),

    switching: d
      .object({
        hasCurrentInsurer: d.boolean().setRequired(true),
        currentInsurerName: d.string().min(1).setRequired(d.eq(d.ref("switching.hasCurrentInsurer"), true)),
        useSwitchingService: d
          .boolean()
          .setDefault(true)
          .setIncluded(d.eq(d.ref("switching.hasCurrentInsurer"), true))
          .describe("Overstapservice: zegt de lopende polis bij de huidige verzekeraar op"),
      })
      .setIncluded(d.eq(d.ref("progress.coverageSelected"), true)),

    payment: d
      .object({
        iban: d.string().regex("^NL\\d{2}[A-Z]{4}\\d{10}$", undefined, "invalid_iban_format").setRequired(true).setPrivate(true),
        directDebitMandate: d.boolean().equals(true, "mandate_required").setRequired(true).describe("Machtiging voor automatische incasso"),
        frequency: d.options(["monthly", "yearly"]).setDefault("monthly").describe("Jaarlijkse betaling levert soms een kleine korting op"),
      })
      .setIncluded(d.eq(d.ref("progress.coverageSelected"), true)),

    confirmation: d
      .object({
        acceptedTerms: d.boolean().equals(true, "terms_must_be_accepted").setRequired(true),
        acceptedIpid: d.boolean().equals(true, "ipid_must_be_accepted").setRequired(true).describe("Product informatie document"),
        acceptedPrivacyStatement: d.boolean().equals(true, "privacy_must_be_accepted").setRequired(true),
      })
      .setIncluded(d.eq(d.ref("progress.coverageSelected"), true)),
    // No `outcome` section: straight-through/pending/rejected, Roy-data
    // verification and the manual-review decision are computed server-side,
    // from data the server already has (this schema's own submitted values,
    // via its own record of them — not a ref into this schema) plus the Roy-
    // data response. None of that reasoning is this schema's to carry, since
    // this schema is shared with the frontend channel and that decision
    // logic has no business being serialized and shipped to a browser.
  })
  .describe("Autoverzekering funnel: kenteken en premie, dekkingskeuze, klantgegevens en acceptatie");

export type CarInsuranceFunnel = d.SchemaValues<typeof carInsuranceFunnelSchema>;
