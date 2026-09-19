# Low-Code Schema Builder — UX Handover

Status: draft design, no visual mockups yet. Written for another designer to pick up and continue — it captures decisions and rationale, not pixel specs.

## 1. Context

dynz is a code-first, serializable schema/validation library (`packages/dynz`) with framework integrations (`@dynz/vue`, `@dynz/react-hook-form`) and a multi-step flow package (`@dynz/funnel`). Today, building a schema means writing TypeScript. This project designs a **low-code builder UI** so internal non-engineers (product/ops/support) can construct and maintain schemas and funnels themselves, without writing dynz's API by hand.

This is a **net-new product surface** — confirmed via repo search: no existing builder package, Figma file, or roadmap mention exists. The `design-system/` directory (where this doc lives) was empty before this work.

## 2. Audience & end users

- **This document's audience:** another designer continuing this work, not engineers. It prioritizes rationale and structure over exhaustive spec.
- **The builder's end users:** internal non-engineers — product/ops/support staff who understand business rules ("require a company email for business accounts") but shouldn't need to write code to express them.
- **Platform assumption (not explicitly confirmed, reasonable default):** desktop web app. This is a complex authoring tool used occasionally by a small internal team — no mobile/responsive requirement assumed unless raised.

## 3. Scope for v1

**In scope**, full dynz surface:
- All schema field types: `string`, `number`, `boolean`, `date`, `object`, `array`, `options`, `enum`, `file`, `expression` (computed field), `literal`, `discriminated_union`, `schema_ref` (reusable field group).
- Full rule set per type (validation constraints — see Appendix).
- Full predicate/condition set (`eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `matches`, `and`, `or`).
- Full transformer set (arithmetic, math, string, `age`/`size`/`lookup`/`pluck` — see Appendix), including as standalone computed fields.
- Two ways to build a multi-step experience: a **paginated schema** (one schema, step metadata) and a true **funnel** (`@dynz/funnel`, independent per-step schemas + branching).
- Reusable field groups (`schema_ref`-backed).
- Curated custom-rule picker (pre-registered rules only).
- Product chrome: schema/funnel list, draft → published workflow, version history.

**Explicitly out of scope for v1:**
- Live/embedded form preview (deferred — see Open Questions, this also blocks on a renderer that doesn't exist yet for paginated schemas).
- Approval/review workflows (single draft→published step, no reviewer gate).
- Authoring genuinely new custom-rule *logic* in the tool (still requires an engineer).
- Non-desktop layouts.

## 4. Decision log

| Decision | Choice | Rationale |
|---|---|---|
| Expression authoring pattern (conditions, rule params, transformer args) | **Formula bar with autocomplete** — single-line input, autocomplete for field names/functions | Reused everywhere; fastest to build; accepted as less "low-code" than a sentence/block builder, in exchange for one consistent, scalable pattern across nested logic and transformer chains |
| Canvas metaphor | **Vertical outline + side property panel** | Matches the formula-bar decision (a document/list model, not freeform); familiar from Notion/Airtable/Typeform/Google Forms builders; nesting = indentation, arrays = collapsible groups |
| Multi-step support | **Both** paginated single schema *and* true `@dynz/funnel` | Users need both a simple "multi-page form" and genuine branching flows; these are structurally different in dynz and need separate treatment (see below) |
| Paginated schema's saved format | **One schema + step metadata** (via a `.setUi({ step })`-style tag), *not* auto-split into `@dynz/funnel` | Avoids the risk of silently rewriting an author's schema into a different shape on save; means a **new, not-yet-built** step-aware renderer is needed to actually walk it page-by-page (flagged as a dependency, §8) |
| Cross-step field-rule violation (a field's own rule refs a field in a different step) | **Hard block**, inline, naming both fields, with a "move to step X" quick action | dynz's `ref()` can't cross independent trees; a cross-step field-level ref would silently resolve to `undefined` at runtime — too easy for a non-engineer to ship broken logic if only warned |
| Step assignment UI (paginated mode) | **Draggable page-break dividers** in one continuous field list | Matches the mental model of Typeform/Tally/Google Forms; avoids a second spatial metaphor (kanban) or a property that's disconnected from visual position (dropdown) |
| Top-level object model | **Schema and Funnel are separate object types** in the list/IA | A paginated schema is still fundamentally "one schema"; a funnel is a different underlying structure (`defineFunnel`, independent step schemas). Keeping them distinct avoids a confusing "type conversion" moment later |
| Live preview | **Not in v1** | Consistent with deferring the paginated-schema renderer; removes a whole preview-pane layout problem from this phase |
| Publish workflow | **Draft → Published + version history**, no approval gate | Safety net (restorable versions) without adding a review-queue UI; appropriate for a trusted internal audience |
| Custom rules | **Curated picker of pre-registered rules only** | `.custom(name, params)` needs real validation logic behind it; the builder only lets authors *select and parameterize*, never define, one |
| Field rename | **Auto-update all `ref()` paths** across the schema/funnel | Refs are literal string paths; anything less than a full "rename symbol" refactor risks silent breakage elsewhere |
| Validation/problem surfacing | **Inline only**, at the offending field | No separate "Problems panel" for v1; simpler surface, revisit if large schemas make inline-only errors hard to discover |
| Reusable field groups | **Included in v1**, backed by dynz's `schema_ref` | The primitive already exists in dynz; cuts duplicate authoring of common blocks (e.g. "Address") |
| Discriminated unions | **Tabs per variant**, each an independent field outline | Matches how the type actually works underneath (each member is a fully separate schema); avoids clutter vs. one flat tagged list |
| Transformers as standalone fields | **Yes** — "Computed field" is a field type (backed by dynz's `expression` schema), in addition to inline use inside rule formulas | A derived value (e.g. a running total) sometimes needs to be its own visible/referenceable thing, not just buried in another field's rule parameter |

## 5. Information architecture

```
Home
├── Schemas (list)
│   ├── [+ New schema]
│   └── Schema detail
│       ├── Draft editor  →  §6.2
│       └── Version history / Published
└── Funnels (list)
    ├── [+ New funnel]
    └── Funnel detail
        ├── Flow editor  →  §6.3
        └── Version history / Published
```

Two top-level, parallel sections. A "new schema" always starts flat (single page); page breaks are added later inside the editor. A "new funnel" starts with one step and an empty transition list.

## 6. Screens

### 6.1 Home / list

Two sections (or tabbed lists): **Schemas** and **Funnels**. Each row: name, status badge (Draft / Published), last edited, last published version. Row action opens the detail view; a version-history affordance (e.g. a clock icon) opens history without entering edit mode.

### 6.2 Schema editor (outline + panel)

Two-pane layout: left = vertical field outline, right = selected field's property panel.

**Outline (left pane):**
- Top-to-bottom list of fields. Nesting (objects) shown via indentation with expand/collapse. Arrays show as a collapsible group with a single "item template" edited once (adding an item at runtime repeats the template — the template itself, not each instance, is what's authored here).
- A `[+ Add field]` control opens the field-type picker: String, Number, Boolean, Date, Options, File, Object (group), Array, Discriminated union, Computed field, Literal, or "Insert reusable group…" (schema_ref).
- **Page-break dividers**: a draggable horizontal divider can be inserted between any two fields, marking "new step starts here." Presence of ≥1 divider makes this a paginated schema; the outline shows step labels (Step 1, Step 2, …) as sticky section headers above each segment.
- Discriminated union fields render as a labeled row that, when expanded, shows **tabs** (one per variant value) — each tab reveals its own nested field outline, fully independent of sibling tabs.
- Inline error state: a field with a validation problem (e.g. cross-step ref violation, ref to a deleted field) shows a red indicator directly on its outline row; expanding it surfaces the message and (where applicable) a quick-fix action.

**Property panel (right pane), for the selected field:**
- Type-specific settings (label, description, default value).
- **Rules** section: add rules from the type's available list (see Appendix); any rule parameter that's a value/reference/expression uses the **formula bar** (autocomplete surfaces field names, scoped to fields the current position could legally reference, plus function names with inline signature hints).
- **Visibility & requirement** section: `Included when…` / `Required when…` / `Mutable when…`, each an optional formula-bar condition (mirrors dynz's `setIncluded`/`setRequired`/`setMutable` predicates). Left empty = always true (always included/required/mutable).
- **Step** (paginated schemas only): read-only indicator of which step this field currently falls in, derived from divider position — not independently editable here, to keep divider position as the single source of truth.
- A "Computed field" selection replaces the normal input-settings with just a formula-bar expression — its value is derived, never user-entered.

**Reusable field groups:** a separate library view (accessible from the field-type picker's "Insert reusable group…" and from its own management screen) lists saved groups; inserting one drops its field tree into the outline at the chosen position, linked back to the source group (edits to the source can optionally propagate — exact propagation behavior is an open question, §8).

**Rename:** renaming a field's key from the outline (or panel) triggers a rename-refactor: every `ref()` path pointing at it, anywhere in the schema (including across steps in paginated mode, and across the whole funnel), is rewritten automatically. A brief confirmation toast names how many references were updated.

### 6.3 Funnel editor (flow view)

A distinct canvas from the schema editor: **steps as nodes** in a left-to-right (or top-to-bottom) flow, connected by transition arrows. Each arrow can carry a `when` condition (formula bar, autocomplete scoped to *any* step's fields via the funnel's merged schema — this cross-step visibility is native to `@dynz/funnel` and needs no special-casing, unlike the paginated-schema case).

Clicking a step node opens that step's own field outline + property panel — reusing the exact same outline/panel component from §6.2, scoped to that one step's independent schema. A field's own rules inside a step can only reference fields within that same step (enforced the same way — inline hard block if violated, since this is the same underlying dynz constraint).

Adding a step: `[+ Add step]` on the canvas; adding a transition: drag from one node's edge to another, then optionally attach a `when`.

### 6.4 Publish & version history

From a schema/funnel detail view: a persistent Draft/Published status indicator and a `[Publish]` action. Publishing snapshots the current draft as a new version and marks it Published; a version-history list (timestamp, author, optional note) allows viewing a past version and restoring it as the new draft.

## 7. Appendix — dynz primitive reference (verified in codebase)

**Schema types** (`packages/dynz/src/types/schema.ts`): `string`, `date`, `number`, `object`, `array`, `options`, `boolean`, `enum`, `file`, `expression`, `literal`, `discriminated_union`, `schema_ref`.

**Rules** (`packages/dynz/src/rules/`): `after`, `before`, `conditional`, `custom`, `email`, `equals`, `includes`, `not-includes`, `is-numeric`, `one-off` (oneOf), `not-one-off`, `regex`, `min`/`max` (numeric), `min-length`/`max-length`, `min-date`/`max-date`, `min-entries`/`max-entries` (array), `min-size`/`max-size` (file), `max-precision`, `mime-type`.

**Predicates** (`packages/dynz/src/functions/predicates.ts`): `and`, `or`, `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `matches`.

**Transformers** (`packages/dynz/src/functions/transformers.ts`): arithmetic — `sum`, `sub`, `multiply`, `divide`, `min`, `max`; math — `ceil`, `floor`, `sin`, `cos`, `tan`; utility — `age`, `size`, `lookup`, `pluck`; string — `trim`, `uppercase`, `lowercase`, `capitalize`, `replace`.

## 8. Open questions / risks for the next designer

1. **Paginated-schema renderer doesn't exist yet.** The "one schema + step metadata" model (§3, §6.2) has no runtime consumer today — only `@dynz/funnel` knows how to walk independent step schemas. Someone needs to design/build a step-aware renderer before a paginated schema can actually be presented to an end user. This doc treats that as a parallel engineering dependency, not a UX problem, but it should be tracked.
2. **Reusable field group propagation** — when a source group is edited after being inserted elsewhere, do existing insertions update automatically, prompt for update, or stay frozen (copy-on-insert)? Not resolved in this pass.
3. **Permissions granularity** — this doc assumes a small trusted internal audience with no formal roles. If the org needs viewer/editor/publisher distinctions, that changes the product-chrome IA in §6.1/§6.4.
4. **Live preview** was deferred, not rejected — worth revisiting once the paginated-schema renderer exists, since a preview pane is likely the highest-leverage addition for a non-engineer's confidence in what they built.
5. **Discriminated-union tab UX at scale** — not tested against a union with many variants (e.g. 10+ payment methods); tabs may need to become a scrollable/searchable list past some threshold.

## 9. Addendum — Channel & multi-experience independence

Added after a follow-up analysis (grilled via interview, not a fresh design pass — see rationale for each line below). **This section exists because this doc, as written, says nothing about channel independence at all** — no mention of voice, chat, or multi-channel anywhere in §1–§8, and it's easy to misread §2's "desktop web app" platform assumption as a statement about the *schemas the builder produces*, when it's actually only about the *builder tool's own UI*. Those are different axes, and this doc conflated them by omission. The gap turned out to be functional, not just editorial: the builder as scoped has no way to author anything channel-specific, and neither does the underlying dynz/funnel architecture as it stands today.

**Scope of "channel/experience independence"**: the same field definitions must be able to drive a web form, a chat UI, and a voice/IVR UI, and a single source of truth must be able to produce different multi-step flows (different step/turn groupings) per channel *and* per experience (e.g. two different web experiences over the same fields) without hand-duplicating funnel definitions.

### 9.1 Resolved decisions

| Decision | Choice | Rationale |
|---|---|---|
| Where channel-specific content (labels, voice/chat phrasing) lives | **Out-of-band**, a per-channel resource keyed by field id — schema stays channel-agnostic | Matches the one pattern already proven in the shipped examples (an i18n JSON file keyed by field path drives the Next example's labels; nothing in either example reads `.ui`/`.meta` for this). Extending that same shape to voice/chat needs no schema changes at all. |
| Field identity for cross-channel content | **`meta.id`** (already defined on every schema type, currently unused anywhere in the codebase), not structural path | Path is an accident of one particular step/turn grouping and shifts across channels, experiences, and reused field groups (`schema_ref`); `id` is the one thing an author assigns once and that stays constant everywhere the field appears. The builder needs to treat `id` as required (auto-generated, editable) on any field that carries cross-channel content. |
| Multi-channel/multi-experience step & turn grouping | A **declarative grouping spec per channel/experience** (an ordered list of field-id groups), compiled into a runtime flow at build/load time, re-using the same underlying field objects — never duplicating field definitions | This is the direct fix for "funnels created from a single schema for different channels": today `FunnelStep.schema` embeds fields inline, so getting a different grouping (3 multi-field web steps vs. 12 single-field voice turns) over the *same* fields means hand-authoring and syncing two separate `defineFunnel()` calls. A spec+compiler layer removes that duplication. |
| Step vs. turn | **One hierarchy, not two separate concepts** — a step (web pagination unit) can contain multiple turns (voice/chat dialogue units) | Lets one grouping spec serve both a chunkier web view and a more granular voice view, instead of authoring entirely separate specs per channel. |
| Foundation this is built on | **One shared object schema**, not `@dynz/funnel`'s independent-per-step-schema model | `included`/`required` are already data-driven and channel-agnostic, so field participation doesn't need a new "which channel is this" predicate — but that only holds if it's genuinely one schema underneath. `@dynz/funnel`'s independent-schema mode is exactly why this doc's own decision log has to hard-block cross-step field refs (§4); building the channel/experience layer on top of *that* model would import the same limitation. `@dynz/funnel` remains the right tool for flows that are inherently single-channel or want architectural isolation between steps — it's narrowed in scope, not removed. |
| Channel-conditional field exclusion (e.g. skip a file-upload field on voice) | **Omit the field from that channel's grouping spec** — no new predicate primitive | Reuses the same mechanism as the grouping spec itself; the compiler translates "not present in this channel's groups" into the right included/required behavior at `validate()` time. A channel-aware `context()`/`channel()` predicate (which dynz's condition system doesn't have today — predicates only resolve against the data tree) is a documented extension point, reserved for if a real case needs channel-*and*-data-combined logic later, not built now. |
| Option display text | **Extend the id-based keying to `(field id, option value)`** pairs | `options()` fields have no `label` today — only `value` — so every example just renders `value.toString()`. Without this, a voice channel has no way to speak anything but the raw stored value. |
| Turn-level validation | **New turn-level `validate` primitive needed** — one field, validated in the context of its full parent schema (so cross-field `ref()`s still resolve), with re-prompt-friendly error output | `@dynz/funnel`'s `validateStep` (`packages/funnel/src/validate.ts:5-12`) only validates a whole step's schema as one atomic unit; there's no supported way today to validate a single field mid-dialogue and get back an error shaped for "ask again," which a voice/chat turn needs. |

### 9.2 Existing decisions in §4/§6.2 that need rework

Two decisions in this doc's original decision log assumed a single, web-only grouping and need to be revisited before the builder UI is built against them:

- **"Paginated schema's saved format"** (§4) — a single `.setUi({ step })`-style tag per field only expresses *one* grouping. It needs to become multiple named groupings per field (one per channel/experience), not a single step number.
- **"Step assignment UI"** (§6.2) — draggable page-break dividers, as designed, produce exactly one step number per field. The interaction needs to account for a field belonging to different groups in different channel/experience views (e.g. a per-channel tab or toggle over the same outline, rather than one global divider set).

### 9.3 Priority re-framing: open risk #1

§8's risk #1 ("paginated-schema renderer doesn't exist yet") was framed as blocking only the deferred live-preview feature. Under this addendum, that renderer generalizes into the grouping-spec compiler above, and it becomes the **load-bearing engineering dependency for the entire channel/multi-experience strategy** — nothing here ships until it exists. It should be tracked as a blocking dependency, not a nice-to-have.

### 9.4 Explicitly not addressed here

- Reusable field-group propagation (§8 risk #2) and permissions granularity (§8 risk #3) are unrelated to channel independence and are unchanged by this addendum.
- The root README's "the same schema drives a web UI, a mobile app, an AI agent via MCP... without modification" claim has no MCP integration, package, or example anywhere in this repo backing it today — noted here only because it's the closest existing (aspirational) precedent for a non-visual consumer; it isn't something this addendum resolves or depends on.
