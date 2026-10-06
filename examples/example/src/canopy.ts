import { and, boolean, eq, gte, number, object, options, ref, string, v, validate } from "dynz";

// Aluminium canopy attached to a house.
// All dimensions are in meters.
//
// Constraints:
//   - Max width:  6m
//   - Max depth:  4m
//   - Max height: 3.5m (wall mount point)
//   - Slope:      minimum 2% (≈ 1.15°) required for water runoff
//
// Conditional addons:
//   - gutterUpgrade    — always available when gutters are enabled
//   - ledLighting      — only available when width >= 3m
//   - infraredHeaters  — only available when width >= 4m
//   - solarRoofPanels  — only available when width >= 4m AND depth >= 3m
//   - roofSkylight     — only available when depth >= 3m
//   - sideScreens      — only available when height >= 2.5m
//   - customRalColor   — only available when color is "custom"

export const canopySchema = object({
  // --- Dimensions ---
  width: number().min(1).max(6),

  depth: number().min(0.5).max(4),

  // Height of the wall attachment point (eave height).
  height: number().min(2).max(3.5),

  // Roof slope as a percentage (rise / run × 100).
  // Minimum 2% ensures adequate water runoff on an aluminium roof.
  slopePercent: number()
    .min(2) // 2% minimum slope
    .max(30), // 30% is a steep but still practical canopy pitch

  // --- Appearance ---
  color: options(["anthracite", "white", "silver", "black", "brown", "custom"]).setDefault("anthracite"),

  // RAL code required only when color is set to "custom".
  customRalCode: string()
    .setIncluded(eq(ref("color"), v("custom")))
    .regex("^RAL\\s?\\d{4}$", undefined, "invalidRalCode"),

  // Powder-coat finish (standard anodised vs. satin vs. gloss).
  finish: options(["anodised", "satin", "gloss"]).setDefault("satin"),

  // --- Gutters ---
  gutters: boolean().setCoerce(true),

  // Upgrade to a wider 150 mm gutter profile — only makes sense when gutters are included.
  gutterUpgrade: boolean()
    .setCoerce(true)
    .setIncluded(eq(ref("gutters"), v(true))),

  // --- Addons ---
  addons: object({
    // LED strip lighting under the crossbeams — requires enough width to be worthwhile.
    ledLighting: boolean()
      .setCoerce(true)
      .setIncluded(gte(ref("$.width"), v(3))),

    // Infrared heater rails — need sufficient width to mount evenly.
    infraredHeaters: boolean()
      .setCoerce(true)
      .setIncluded(gte(ref("$.width"), v(4))),

    // Integrated solar panels on the aluminium roof — need both width and depth.
    solarRoofPanels: boolean()
      .setCoerce(true)
      .setIncluded(and(gte(ref("$.width"), v(4)), gte(ref("$.depth"), v(3)))),

    // Roof skylight / opening panel — requires enough depth to accommodate the frame.
    roofSkylight: boolean()
      .setCoerce(true)
      .setIncluded(gte(ref("$.depth"), v(3))),

    // Retractable or fixed side screens — only practical at sufficient standing height.
    sideScreens: boolean()
      .setCoerce(true)
      .setIncluded(gte(ref("$.height"), v(2.5))),

    // Side screen style — only shown when side screens are selected.
    sideScreenStyle: options(["fixed", "retractable", "louvred"])
      .setDefault("fixed")
      .setIncluded(and(gte(ref("$.height"), v(2.5)), eq(ref("$.addons.sideScreens"), v(true)))),
  }).setPrivate(false),
}).setPrivate(false);

export function runCanopyDemo() {
  // Example: a wide canopy with most addons unlocked.
  const result = validate(canopySchema, undefined, {
    width: 5,
    depth: 3.5,
    height: 2.7,
    slopePercent: 5,
    color: "anthracite",
    finish: "satin",
    gutters: true,
    gutterUpgrade: true,
    addons: {
      ledLighting: true,
      infraredHeaters: true,
      solarRoofPanels: true,
      roofSkylight: true,
      sideScreens: true,
      sideScreenStyle: "retractable",
    },
  });

  console.log("--- Canopy validation result ---");
  console.log(JSON.stringify(result, null, 2));
}
