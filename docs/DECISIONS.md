# Architectural decisions

## ADR1 — Independent studio chrome and a shared validated theme

**Context.** A contrast tool must let users create deliberately failing colors without hiding its controls. Preview and reported values must agree.

**Alternatives.** Theme the whole editor; render a screenshot; duplicate token mappings for preview and export; rely on pixel sampling.

**Decision.** React renders fixed-color editor chrome around an isolated preview. `cssProperties` is the single mapping used by preview and CSS export, while contrast pairs refer directly to the same validated token keys.

**Consequences.** Failures remain fixable, preview interactions are real, and mismatch is regression-tested with computed styles. Fixed chrome also needs independent accessibility review. Four pairs are explicit and do not imply every component state has been audited.

**Revisit.** Add state-specific pair definitions when new component variants or interaction states are introduced; do not generalize the four results into a whole-system badge.

## ADR2 — Opaque sRGB and unrounded WCAG decisions

**Context.** A visually impressive palette tool can become misleading if it rounds scores into passes or measures swatches unrelated to rendered content.

**Alternatives.** Allow arbitrary CSS colors/gradients; use a color library; round to two decimals before classification; estimate contrast by hue.

**Decision.** Accept only six-digit opaque sRGB hex. Implement the W3C piecewise transfer at 0.04045, luminance coefficients and contrast equation in a pure module. Classify raw ratios, format only for display. Normal AA is the primary result; large AA and normal AAA remain separately labelled.

**Consequences.** No alpha compositing, gradients, wide-gamut colors, images or semantic accessibility claims. The small mathematical surface has known-pair and exact-boundary tests. A displayed 4.50 can correctly remain a fail.

**Revisit.** Wider color support requires an explicit color-space/compositing contract and tests against actual browser rendering before accepting new syntax.

## ADR3 — Drafts outside committed history

**Context.** Editing a hex code temporarily produces invalid strings. An invalid draft must neither corrupt the palette nor erase what the user typed.

**Alternatives.** Commit every keystroke; silently replace partial values with black; block input characters; store raw drafts in the theme.

**Decision.** Hex and name inputs keep local drafts; Enter/blur attempts a validated commit. The reducer holds only valid themes and bounded immutable history. Invalid hex retains its text and error. Escape restores the last committed color. Preset/reset/import are undoable complete workspace commits; mode navigation preserves both modes.

**Consequences.** Export and saving always use the committed model, even while a field shows an invalid draft. Every slider/picker change counts as a commit, so rapid adjustments can consume the 50-step history budget. Undo can return to the mode associated with a prior edit.

**Revisit.** Coalesce continuous gestures into transactions if larger editing sessions need more intuitive undo units; preserve separate draft/commit semantics.

## ADR4 — Versioned local persistence with visible failure

**Context.** The studio should survive reload without accounts or remote storage, while denied or corrupt browser storage must not prevent use.

**Alternatives.** No persistence; persist each field independently; introduce an API; treat localStorage reads as trusted.

**Decision.** Persist one versioned workspace containing both validated mode themes and a known reset preset. Validate the entire snapshot on read; fall back to Orchard with a warning. Catch storage getter, read and write failures. Keep history in memory and allow JSON export regardless of saving availability.

**Consequences.** Storage is small and coherent, but synchronous and local to the browser origin. No encrypted storage, backup, migrations beyond version 1 or cross-tab merge. Last-write-wins multi-tab behavior is documented.

**Revisit.** Add explicit revision conflicts and migration functions before cloud collaboration or shared multi-tab editing; do not assume browser storage is a durable backend.

## ADR5 — Strict JSON and fixed export scope

**Context.** Import and export turn a theme editor into an untrusted-input boundary. User names must not become executable CSS or arbitrary selectors.

**Alternatives.** Parse arbitrary CSS; spread unknown imported properties into styles; let the name determine a selector; trust a `.json` extension.

**Decision.** Bound files to 32 KiB, validate exact keys/version/types, reject unknown properties and unsafe names, and normalize hex. CSS uses only `[data-theme="light"]` or `[data-theme="dark"]`. Fixed property names and validated values supply each declaration. JSON export contains the active theme; import applies only its declared mode.

**Consequences.** The file format is deliberately narrow and rejects otherwise harmless extra metadata. A name can be human-friendly but not arbitrary markup. Reimport preserves the other mode. Files and exports remain local.

**Revisit.** Add a versioned extension mechanism if metadata or multi-theme bundles become necessary; do not weaken strict validation through ad hoc property spreading.

## ADR6 — Generation fencing for local file reads

**Context.** `File.text()` is asynchronous. A user may choose a preset or edit a color while a previous import is still reading.

**Alternatives.** Disable the whole editor during import; let last completion win; rely on FileReader abort alone.

**Decision.** Assign each read a generation; any newer editor action, draft keystroke or import invalidates it. Only the current generation may dispatch success/error or clear the reading state. Unmount also invalidates pending work.

**Consequences.** The UI remains usable and old results cannot overwrite newer intent. This cancels commit authority, not the underlying read. The 32 KiB bound controls residual work. Browser race tests deliberately delay the read, then select a newer preset or type an uncommitted color/name draft.

**Revisit.** If very large files or workers are added, combine the same authority check with actual abort/worker termination and explicit progress reporting.

## ADR 007 — Actionable contrast with shared-token previews

**Context.** Ratios identified failures but only the button label offered a direct repair. Users had to scroll back and map token names to fields themselves.

**Decision.** Every measured pair links to its foreground editor. Failing pairs may suggest black/white, chosen by the largest weakest ratio across all measured uses of the same token. The UI states shared effects and projected ratios before applying. If both candidates fail a shared pair, explain the limit and keep manual editing available. One reducer action applies the token; normal undo and import fencing remain intact.

**Tradeoff.** This is a tiny, inspectable two-candidate helper, not a palette optimization algorithm. It can decline when another intermediate color would pass. Warnings and raw-ratio checks prevent a rounded display or a single improved pair from being mistaken for a complete repair. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), reviewed 17 September 2026, remains the basis of the existing math.

**Export refinement.** Both-mode export composes two existing validated CSS outputs rather than introducing a new schema. This keeps strict selector/token validation in one place, avoids coupling light and dark palettes and requires no import migration.


## Complete workspace backup — September 2026

Expose a complete backup as a distinct action while preserving single-theme JSON interoperability. Reusing the existing validated Workspace shape avoids a second serialization model. Strict top-level keys make hybrid or future-version files fail visibly instead of partially importing. A backup restores active mode and preset because they explain reset behavior, but excludes session-only drafts/history. Mode imports remain single-mode replacements. Revisit explicit migrations when the workspace schema evolves. References: [React state ownership](https://react.dev/learn/managing-state), [Blob URL lifecycle](https://developer.mozilla.org/en-US/docs/Web/API/URL/revokeObjectURL_static).
