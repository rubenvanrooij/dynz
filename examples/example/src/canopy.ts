import * as d from "dynz";

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

export const canopySchema = d.object({
    private: false,
    fields: {
        // --- Dimensions ---
        width: d.number({
            rules: [
                d.min(d.v(1)),
                d.max(d.v(6)),
            ],
        }),

        depth: d.number({
            rules: [
                d.min(d.v(0.5)),
                d.max(d.v(4)),
            ],
        }),

        // Height of the wall attachment point (eave height).
        height: d.number({
            rules: [
                d.min(d.v(2)),
                d.max(d.v(3.5)),
            ],
        }),

        // Roof slope as a percentage (rise / run × 100).
        // Minimum 2% ensures adequate water runoff on an aluminium roof.
        slopePercent: d.number({
            rules: [
                d.min(d.v(2)),    // 2% minimum slope
                d.max(d.v(30)),   // 30% is a steep but still practical canopy pitch
            ],
        }),

        // --- Appearance ---
        color: d.options({
            default: "anthracite",
            options: ["anthracite", "white", "silver", "black", "brown", "custom"],
        }),

        // RAL code required only when color is set to "custom".
        customRalCode: d.string({
            included: d.eq(d.ref("color"), d.v("custom")),
            rules: [
                d.regex("^RAL\\s?\\d{4}$", "invalidRalCode"),
            ],
        }),

        // Powder-coat finish (standard anodised vs. satin vs. gloss).
        finish: d.options({
            default: "satin",
            options: ["anodised", "satin", "gloss"],
        }),

        // --- Gutters ---
        gutters: d.boolean({
            coerce: true,
        }),

        // Upgrade to a wider 150 mm gutter profile — only makes sense when gutters are included.
        gutterUpgrade: d.boolean({
            coerce: true,
            included: d.eq(d.ref("gutters"), d.v(true)),
        }),

        // --- Addons ---
        addons: d.object({
            fields: {
                // LED strip lighting under the crossbeams — requires enough width to be worthwhile.
                ledLighting: d.boolean({
                    coerce: true,
                    included: d.gte(d.ref("$.width"), d.v(3)),
                }),

                // Infrared heater rails — need sufficient width to mount evenly.
                infraredHeaters: d.boolean({
                    coerce: true,
                    included: d.gte(d.ref("$.width"), d.v(4)),
                }),

                // Integrated solar panels on the aluminium roof — need both width and depth.
                solarRoofPanels: d.boolean({
                    coerce: true,
                    included: d.and(
                        d.gte(d.ref("$.width"), d.v(4)),
                        d.gte(d.ref("$.depth"), d.v(3)),
                    ),
                }),

                // Roof skylight / opening panel — requires enough depth to accommodate the frame.
                roofSkylight: d.boolean({
                    coerce: true,
                    included: d.gte(d.ref("$.depth"), d.v(3)),
                }),

                // Retractable or fixed side screens — only practical at sufficient standing height.
                sideScreens: d.boolean({
                    coerce: true,
                    included: d.gte(d.ref("$.height"), d.v(2.5)),
                }),

                // Side screen style — only shown when side screens are selected.
                sideScreenStyle: d.options({
                    default: "fixed",
                    options: ["fixed", "retractable", "louvred"],
                    included: d.and(
                        d.gte(d.ref("$.height"), d.v(2.5)),
                        d.eq(d.ref("$.addons.sideScreens"), d.v(true)),
                    ),
                }),
            },
        }),
    },
});

export function runCanopyDemo() {
    // Example: a wide canopy with most addons unlocked.
    const result = d.validate(canopySchema, undefined, {
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
