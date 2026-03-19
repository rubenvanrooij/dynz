import * as d from "dynz";

/**
 * Dutch Pension Application Multi-Step Form
 *
 * This schema represents a realistic pension application form with 3 steps:
 * 1. Personal Information - Basic personal details and contact info
 * 2. Employment & Income - Work history and financial information
 * 3. Pension Preferences - Retirement planning and options
 *
 * Features extensive conditional logic based on Dutch pension system rules.
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export const Gender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
  PREFER_NOT_TO_SAY: "prefer_not_to_say",
} as const;

export const MaritalStatus = {
  SINGLE: "single",
  MARRIED: "married",
  REGISTERED_PARTNERSHIP: "registered_partnership",
  DIVORCED: "divorced",
  WIDOWED: "widowed",
  COHABITING: "cohabiting",
} as const;

export const EmploymentStatus = {
  EMPLOYED: "employed",
  SELF_EMPLOYED: "self_employed",
  UNEMPLOYED: "unemployed",
  RETIRED: "retired",
  STUDENT: "student",
  DISABILITY: "disability",
} as const;

export const ContractType = {
  PERMANENT: "permanent",
  TEMPORARY: "temporary",
  FREELANCE: "freelance",
  ZERO_HOURS: "zero_hours",
} as const;

export const Sector = {
  HEALTHCARE: "healthcare",
  EDUCATION: "education",
  GOVERNMENT: "government",
  FINANCE: "finance",
  TECHNOLOGY: "technology",
  CONSTRUCTION: "construction",
  RETAIL: "retail",
  HOSPITALITY: "hospitality",
  AGRICULTURE: "agriculture",
  OTHER: "other",
} as const;

export const PensionType = {
  DEFINED_BENEFIT: "defined_benefit", // Uitkeringsovereenkomst
  DEFINED_CONTRIBUTION: "defined_contribution", // Premieovereenkomst
  HYBRID: "hybrid", // Combinatie
} as const;

export const RetirementAge = {
  AOW_AGE: "aow_age", // Standard AOW age (67+)
  EARLY_62: "early_62", // Early retirement at 62
  EARLY_63: "early_63",
  EARLY_64: "early_64",
  EARLY_65: "early_65",
  LATE_68: "late_68", // Late retirement
  LATE_70: "late_70",
} as const;

export const SurvivorPensionOption = {
  PARTNER_70: "partner_70", // 70% to partner
  PARTNER_50: "partner_50", // 50% to partner
  PARTNER_CHILDREN: "partner_children", // Split between partner and children
  NONE: "none", // No survivor pension
} as const;

// ============================================================================
// STEP 1: PERSONAL INFORMATION
// ============================================================================

export const PersonalInfoSchema = d.object({
  fields: {
    // Basic identification
    firstName: d.string({
      rules: [d.minLength(d.v(2)), d.maxLength(d.v(50))],
    }),

    middleName: d.string({
      required: false,
      rules: [d.maxLength(d.v(30))],
    }),

    lastName: d.string({
      rules: [d.minLength(d.v(2)), d.maxLength(d.v(100))],
    }),

    // Dutch BSN (Burgerservicenummer) - 9 digits
    bsn: d.string({
      rules: [d.regex("^[0-9]{9}$", "BSN moet 9 cijfers bevatten")],
      // private: true,
    }),

    dateOfBirth: d.date({
      rules: [
        // Must be at least 18 years old
        d.maxDate(d.v(new Date(new Date().setFullYear(new Date().getFullYear() - 18)))),
        // Must be younger than 100
        d.minDate(d.v(new Date(new Date().setFullYear(new Date().getFullYear() - 100)))),
      ],
    }),

    gender: d.options({
      options: Object.values(Gender),
    }),

    // Contact information
    email: d.string({
      rules: [d.email()],
    }),

    phoneNumber: d.string({
      rules: [d.regex("^(\\+31|0)[0-9]{9}$", "Voer een geldig Nederlands telefoonnummer in")],
    }),

    // Address
    postalCode: d.string({
      rules: [d.regex("^[1-9][0-9]{3}\\s?[A-Za-z]{2}$", "Voer een geldige postcode in (bijv. 1234 AB)")],
    }),

    houseNumber: d.string({
      rules: [d.regex("^[0-9]+[A-Za-z]?$")],
    }),

    houseNumberAddition: d.string({
      required: false,
      rules: [d.maxLength(d.v(10))],
    }),

    // Marital status - affects survivor pension options
    maritalStatus: d.options({
      options: Object.values(MaritalStatus),
    }),

    // Partner information - only if married/partnership/cohabiting
    partnerDateOfBirth: d.date({
      included: d.isIn(
        d.ref("maritalStatus"),
        d.v([MaritalStatus.MARRIED, MaritalStatus.REGISTERED_PARTNERSHIP, MaritalStatus.COHABITING])
      ),
      rules: [d.maxDate(d.v(new Date(new Date().setFullYear(new Date().getFullYear() - 18))))],
    }),

    // Partner BSN for survivor pension registration
    partnerBsn: d.string({
      included: d.isIn(d.ref("maritalStatus"), d.v([MaritalStatus.MARRIED, MaritalStatus.REGISTERED_PARTNERSHIP])),
      rules: [d.regex("^[0-9]{9}$", "BSN moet 9 cijfers bevatten")],
      // private: true,
    }),

    // Children information - affects survivor pension
    hasChildrenUnder21: d.boolean({}),

    numberOfChildrenUnder21: d.number({
      included: d.eq(d.ref("hasChildrenUnder21"), d.v(true)),
      rules: [d.min(d.v(1)), d.max(d.v(20))],
    }),
  },
});

// ============================================================================
// STEP 2: EMPLOYMENT & INCOME
// ============================================================================

export const EmploymentIncomeSchema = d.object({
  fields: {
    // Current employment status
    employmentStatus: d.options({
      options: Object.values(EmploymentStatus),
    }),

    // Employer information - only for employed persons
    employerName: d.string({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
      rules: [d.minLength(d.v(2)), d.maxLength(d.v(100))],
    }),

    // Sector - for pension fund determination
    sector: d.options({
      options: Object.values(Sector),
      included: d.or(
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.SELF_EMPLOYED))
      ),
    }),

    // Contract type - affects pension accrual
    contractType: d.options({
      options: Object.values(ContractType),
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
    }),

    // Employment start date
    employmentStartDate: d.date({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
      rules: [d.maxDate(d.v(new Date()))],
    }),

    // Part-time percentage (100 = full-time)
    partTimePercentage: d.number({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
      rules: [d.min(d.v(0)), d.max(d.v(100))],
    }),

    // Annual salary (bruto)
    annualGrossSalary: d.number({
      included: d.or(
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.SELF_EMPLOYED))
      ),
      rules: [
        d.min(d.v(0)),
        d.max(d.v(500000)), // Reasonable upper limit
      ],
    }),

    // Pension base (pensioengrondslag) - often salary minus franchise
    pensionBase: d.number({
      included: d.or(
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
        d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.SELF_EMPLOYED))
      ),
      rules: [
        d.min(d.v(0)),
        // Pension base cannot exceed gross salary
        d.max(d.ref("annualGrossSalary")),
      ],
    }),

    // Holiday allowance included in salary?
    holidayAllowanceIncluded: d.boolean({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.EMPLOYED)),
    }),

    // Previous employment history - important for pension transfer
    hasPreviousEmployer: d.boolean({}),

    // Previous pension provider for potential value transfer
    previousPensionProvider: d.string({
      included: d.eq(d.ref("hasPreviousEmployer"), d.v(true)),
      required: false,
      rules: [d.maxLength(d.v(100))],
    }),

    // Self-employment years - for ZZP pension rules
    selfEmploymentYears: d.number({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.SELF_EMPLOYED)),
      rules: [d.min(d.v(0)), d.max(d.v(50))],
    }),

    // Chamber of Commerce number for self-employed
    kvkNumber: d.string({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.SELF_EMPLOYED)),
      rules: [d.regex("^[0-9]{8}$", "KVK-nummer moet 8 cijfers bevatten")],
    }),

    // Monthly disability benefit amount - for disability status
    monthlyDisabilityBenefit: d.number({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.DISABILITY)),
      rules: [d.min(d.v(0)), d.max(d.v(10000))],
    }),

    // WIA percentage - disability percentage
    wiaPercentage: d.number({
      included: d.eq(d.ref("employmentStatus"), d.v(EmploymentStatus.DISABILITY)),
      rules: [d.min(d.v(35)), d.max(d.v(100))], // WIA starts at 35%
    }),
  },
});

// ============================================================================
// STEP 3: PENSION PREFERENCES
// ============================================================================

export const PensionPreferencesSchema = d.object({
  fields: {
    // Preferred retirement age
    preferredRetirementAge: d.options({
      options: Object.values(RetirementAge),
    }),

    // Early retirement confirmation - must understand consequences
    earlyRetirementAcknowledgement: d.boolean({
      included: d.isIn(
        d.ref("preferredRetirementAge"),
        d.v([RetirementAge.EARLY_62, RetirementAge.EARLY_63, RetirementAge.EARLY_64, RetirementAge.EARLY_65])
      ),
      rules: [d.equals(d.v(true), "U moet bevestigen dat u de gevolgen van vervroegd pensioen begrijpt")],
    }),

    // Pension type preference
    pensionTypePreference: d.options({
      options: Object.values(PensionType),
    }),

    // Investment risk profile - for defined contribution
    investmentRiskProfile: d.options({
      options: ["defensive", "neutral", "offensive"] as const,
      included: d.eq(d.ref("pensionTypePreference"), d.v(PensionType.DEFINED_CONTRIBUTION)),
    }),

    // Lifecycle option - automatic de-risking as retirement approaches
    useLifecycleOption: d.boolean({
      included: d.eq(d.ref("pensionTypePreference"), d.v(PensionType.DEFINED_CONTRIBUTION)),
    }),

    // Survivor pension option - based on marital status from Step 1
    survivorPensionOption: d.options({
      options: Object.values(SurvivorPensionOption),
    }),

    // Partner consent for waiving survivor pension
    partnerConsentWaiver: d.boolean({
      // Required if married/partnership and choosing no survivor pension
      included: d.eq(d.ref("survivorPensionOption"), d.v(SurvivorPensionOption.NONE)),
      rules: [d.equals(d.v(true), "Uw partner moet toestemming geven voor het afzien van partnerpensioen")],
    }),

    // Additional voluntary contribution (AVC)
    wantsAdditionalContribution: d.boolean({}),

    // AVC percentage of salary
    additionalContributionPercentage: d.number({
      included: d.eq(d.ref("wantsAdditionalContribution"), d.v(true)),
      rules: [
        d.min(d.v(0.5)),
        d.max(d.v(30)), // Max fiscal limit
      ],
    }),

    // Hoog-laag construction - higher pension first, lower later (or vice versa)
    hoogLaagOption: d.options({
      options: ["standard", "hoog_laag", "laag_hoog"] as const,
    }),

    // Ratio for hoog-laag (e.g., 100:75 means first period 100%, second 75%)
    hoogLaagRatio: d.options({
      options: ["100_75", "100_70", "75_100", "70_100"] as const,
      included: d.neq(d.ref("hoogLaagOption"), d.v("standard")),
    }),

    // Exchange partner pension for higher retirement pension
    exchangePartnerPension: d.boolean({
      included: d.neq(d.ref("survivorPensionOption"), d.v(SurvivorPensionOption.NONE)),
    }),

    // Pension income test waiver
    pensionIncomeTestWaiver: d.boolean({
      required: false,
    }),

    // Communication preferences
    digitalCommunicationOnly: d.boolean({}),

    // Annual statement preference
    annualStatementByMail: d.boolean({
      included: d.eq(d.ref("digitalCommunicationOnly"), d.v(false)),
    }),

    // Tax optimization preference
    wantsTaxAdvice: d.boolean({}),

    // Declaration of accuracy
    declarationOfAccuracy: d.boolean({
      rules: [d.equals(d.v(true), "U moet verklaren dat alle ingevulde gegevens naar waarheid zijn ingevuld")],
    }),
  },
});

// ============================================================================
// COMPLETE MULTI-STEP FORM SCHEMA
// ============================================================================

export const PensionApplicationSchema = d.object({
  fields: {
    // Step 1
    personalInfo: PersonalInfoSchema,
    // Step 2
    employmentIncome: EmploymentIncomeSchema,
    // Step 3
    pensionPreferences: PensionPreferencesSchema,
  },
});

// Helper type for form values
export type PensionApplicationValues = {
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    bsn: string;
    dateOfBirth: Date;
    gender: (typeof Gender)[keyof typeof Gender];
    email: string;
    phoneNumber: string;
    postalCode: string;
    houseNumber: string;
    houseNumberAddition?: string;
    maritalStatus: (typeof MaritalStatus)[keyof typeof MaritalStatus];
    partnerDateOfBirth?: Date;
    partnerBsn?: string;
    hasChildrenUnder21: boolean;
    numberOfChildrenUnder21?: number;
  };
  employmentIncome: {
    employmentStatus: (typeof EmploymentStatus)[keyof typeof EmploymentStatus];
    employerName?: string;
    sector?: (typeof Sector)[keyof typeof Sector];
    contractType?: (typeof ContractType)[keyof typeof ContractType];
    employmentStartDate?: Date;
    partTimePercentage?: number;
    annualGrossSalary?: number;
    pensionBase?: number;
    holidayAllowanceIncluded?: boolean;
    hasPreviousEmployer: boolean;
    previousPensionProvider?: string;
    selfEmploymentYears?: number;
    kvkNumber?: string;
    monthlyDisabilityBenefit?: number;
    wiaPercentage?: number;
  };
  pensionPreferences: {
    preferredRetirementAge: (typeof RetirementAge)[keyof typeof RetirementAge];
    earlyRetirementAcknowledgement?: boolean;
    pensionTypePreference: (typeof PensionType)[keyof typeof PensionType];
    investmentRiskProfile?: "defensive" | "neutral" | "offensive";
    useLifecycleOption?: boolean;
    survivorPensionOption: (typeof SurvivorPensionOption)[keyof typeof SurvivorPensionOption];
    partnerConsentWaiver?: boolean;
    wantsAdditionalContribution: boolean;
    additionalContributionPercentage?: number;
    hoogLaagOption: "standard" | "hoog_laag" | "laag_hoog";
    hoogLaagRatio?: "100_75" | "100_70" | "75_100" | "70_100";
    exchangePartnerPension?: boolean;
    pensionIncomeTestWaiver?: boolean;
    digitalCommunicationOnly: boolean;
    annualStatementByMail?: boolean;
    wantsTaxAdvice: boolean;
    declarationOfAccuracy: boolean;
  };
};
