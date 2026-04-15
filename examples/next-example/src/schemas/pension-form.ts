import { boolean, date, eq, isIn, neq, number, object, options, or, ref, string, v } from "dynz";

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

export const PersonalInfoSchema = object({
  // Basic identification
  firstName: string().min(2).max(50),

  middleName: string().optional().max(30),

  lastName: string().min(2).max(100),

  // Dutch BSN (Burgerservicenummer) - 9 digits
  bsn: string().regex("^[0-9]{9}$", undefined, "BSN moet 9 cijfers bevatten"),
  // .setPrivate(true),

  dateOfBirth: date()
    // Must be at least 18 years old
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)))
    // Must be younger than 100
    .min(new Date(new Date().setFullYear(new Date().getFullYear() - 100))),

  gender: options(Object.values(Gender)),

  // Contact information
  email: string().email(),

  phoneNumber: string().regex("^(\\+31|0)[0-9]{9}$", undefined, "Voer een geldig Nederlands telefoonnummer in"),

  // Address
  postalCode: string().regex(
    "^[1-9][0-9]{3}\\s?[A-Za-z]{2}$",
    undefined,
    "Voer een geldige postcode in (bijv. 1234 AB)"
  ),

  houseNumber: string().regex("^[0-9]+[A-Za-z]?$"),

  houseNumberAddition: string().optional().max(10),

  // Marital status - affects survivor pension options
  maritalStatus: options(Object.values(MaritalStatus)),

  // Partner information - only if married/partnership/cohabiting
  partnerDateOfBirth: date()
    .setIncluded(
      isIn(
        ref("maritalStatus"),
        v([MaritalStatus.MARRIED, MaritalStatus.REGISTERED_PARTNERSHIP, MaritalStatus.COHABITING])
      )
    )
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18))),

  // Partner BSN for survivor pension registration
  partnerBsn: string()
    .setIncluded(isIn(ref("maritalStatus"), v([MaritalStatus.MARRIED, MaritalStatus.REGISTERED_PARTNERSHIP])))
    .regex("^[0-9]{9}$", undefined, "BSN moet 9 cijfers bevatten"),
  // .setPrivate(true),

  // Children information - affects survivor pension
  hasChildrenUnder21: boolean(),

  numberOfChildrenUnder21: number()
    .setIncluded(eq(ref("hasChildrenUnder21"), v(true)))
    .min(1)
    .max(20),
});

// ============================================================================
// STEP 2: EMPLOYMENT & INCOME
// ============================================================================

export const EmploymentIncomeSchema = object({
  // Current employment status
  employmentStatus: options(Object.values(EmploymentStatus)),

  // Employer information - only for employed persons
  employerName: string()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)))
    .min(2)
    .max(100),

  // Sector - for pension fund determination
  sector: options(Object.values(Sector)).setIncluded(
    or(
      eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)),
      eq(ref("employmentStatus"), v(EmploymentStatus.SELF_EMPLOYED))
    )
  ),

  // Contract type - affects pension accrual
  contractType: options(Object.values(ContractType)).setIncluded(
    eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED))
  ),

  // Employment start date
  employmentStartDate: date()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)))
    .max(new Date()),

  // Part-time percentage (100 = full-time)
  partTimePercentage: number()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)))
    .min(0)
    .max(100),

  // Annual salary (bruto)
  annualGrossSalary: number()
    .setIncluded(
      or(
        eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)),
        eq(ref("employmentStatus"), v(EmploymentStatus.SELF_EMPLOYED))
      )
    )
    .min(0)
    .max(500000), // Reasonable upper limit

  // Pension base (pensioengrondslag) - often salary minus franchise
  pensionBase: number()
    .setIncluded(
      or(
        eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED)),
        eq(ref("employmentStatus"), v(EmploymentStatus.SELF_EMPLOYED))
      )
    )
    .min(0)
    // Pension base cannot exceed gross salary
    .max(ref("annualGrossSalary")),

  // Holiday allowance included in salary?
  holidayAllowanceIncluded: boolean().setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.EMPLOYED))),

  // Previous employment history - important for pension transfer
  hasPreviousEmployer: boolean(),

  // Previous pension provider for potential value transfer
  previousPensionProvider: string()
    .setIncluded(eq(ref("hasPreviousEmployer"), v(true)))
    .optional()
    .max(100),

  // Self-employment years - for ZZP pension rules
  selfEmploymentYears: number()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.SELF_EMPLOYED)))
    .min(0)
    .max(50),

  // Chamber of Commerce number for self-employed
  kvkNumber: string()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.SELF_EMPLOYED)))
    .regex("^[0-9]{8}$", undefined, "KVK-nummer moet 8 cijfers bevatten"),

  // Monthly disability benefit amount - for disability status
  monthlyDisabilityBenefit: number()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.DISABILITY)))
    .min(0)
    .max(10000),

  // WIA percentage - disability percentage
  wiaPercentage: number()
    .setIncluded(eq(ref("employmentStatus"), v(EmploymentStatus.DISABILITY)))
    .min(35) // WIA starts at 35%
    .max(100),
});

// ============================================================================
// STEP 3: PENSION PREFERENCES
// ============================================================================

export const PensionPreferencesSchema = object({
  // Preferred retirement age
  preferredRetirementAge: options(Object.values(RetirementAge)),

  // Early retirement confirmation - must understand consequences
  earlyRetirementAcknowledgement: boolean()
    .setIncluded(
      isIn(
        ref("preferredRetirementAge"),
        v([RetirementAge.EARLY_62, RetirementAge.EARLY_63, RetirementAge.EARLY_64, RetirementAge.EARLY_65])
      )
    )
    .equals(v(true), "U moet bevestigen dat u de gevolgen van vervroegd pensioen begrijpt"),

  // Pension type preference
  pensionTypePreference: options(Object.values(PensionType)),

  // Investment risk profile - for defined contribution
  investmentRiskProfile: options(["defensive", "neutral", "offensive"] as const).setIncluded(
    eq(ref("pensionTypePreference"), v(PensionType.DEFINED_CONTRIBUTION))
  ),

  // Lifecycle option - automatic de-risking as retirement approaches
  useLifecycleOption: boolean().setIncluded(eq(ref("pensionTypePreference"), v(PensionType.DEFINED_CONTRIBUTION))),

  // Survivor pension option - based on marital status from Step 1
  survivorPensionOption: options(Object.values(SurvivorPensionOption)),

  // Partner consent for waiving survivor pension
  partnerConsentWaiver: boolean()
    // Required if married/partnership and choosing no survivor pension
    .setIncluded(eq(ref("survivorPensionOption"), v(SurvivorPensionOption.NONE)))
    .equals(v(true), "Uw partner moet toestemming geven voor het afzien van partnerpensioen"),

  // Additional voluntary contribution (AVC)
  wantsAdditionalContribution: boolean(),

  // AVC percentage of salary
  additionalContributionPercentage: number()
    .setIncluded(eq(ref("wantsAdditionalContribution"), v(true)))
    .min(0.5)
    .max(30), // Max fiscal limit

  // Hoog-laag construction - higher pension first, lower later (or vice versa)
  hoogLaagOption: options(["standard", "hoog_laag", "laag_hoog"] as const),

  // Ratio for hoog-laag (e.g., 100:75 means first period 100%, second 75%)
  hoogLaagRatio: options(["100_75", "100_70", "75_100", "70_100"] as const).setIncluded(
    neq(ref("hoogLaagOption"), v("standard"))
  ),

  // Exchange partner pension for higher retirement pension
  exchangePartnerPension: boolean().setIncluded(neq(ref("survivorPensionOption"), v(SurvivorPensionOption.NONE))),

  // Pension income test waiver
  pensionIncomeTestWaiver: boolean().optional(),

  // Communication preferences
  digitalCommunicationOnly: boolean(),

  // Annual statement preference
  annualStatementByMail: boolean().setIncluded(eq(ref("digitalCommunicationOnly"), v(false))),

  // Tax optimization preference
  wantsTaxAdvice: boolean(),

  // Declaration of accuracy
  declarationOfAccuracy: boolean().equals(
    v(true),
    "U moet verklaren dat alle ingevulde gegevens naar waarheid zijn ingevuld"
  ),
});

// ============================================================================
// COMPLETE MULTI-STEP FORM SCHEMA
// ============================================================================

export const PensionApplicationSchema = object({
  // Step 1
  personalInfo: PersonalInfoSchema,
  // Step 2
  employmentIncome: EmploymentIncomeSchema,
  // Step 3
  pensionPreferences: PensionPreferencesSchema,
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
