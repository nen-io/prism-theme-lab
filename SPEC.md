# Prism — Theme and contrast workbench

This document defines the behavior and acceptance criteria. All demonstration data is synthetic. The demo runs without a login or API key.

## Product and visual design
A colorful but disciplined design studio with a large realistic component preview, swatch rail and live type scale. Give light/dark theme meaningful separate values. Contrast scores must describe actual rendered foreground/background pairs, not decorative palette scores.

## Model and rules
Theme v1 {name,mode,tokens:{background,surface,text,muted,accent,accentText,border},fontScale}. Tokens are six-digit opaque sRGB hex only; scale0.85..1.4 finite. WCAG relative luminance uses sRGB piecewise0.04045 and contrast (Llight+.05)/(Ldark+.05). Text normal AA4.5:1, large3:1 with actual size/weight requirement described; AAA7:1 normal. Ratio rounding never changes pass decision. Solid colors only; no automated accessibility certification.

## Required behavior
1. At least3 attractive presets with separate light/dark values, editable native color pickers plus hex inputs, name and text scale controls. Invalid partial hex remains draft and shows error on commit without corrupting saved theme.
2. Real preview of navigation, content card, form field, primary button and muted text uses exact active tokens. Contrast panel tests text/background, text/surface, muted/surface and accentText/accent. Display ratio, requirement and pass/fail in text.
3. Undo/redo for committed edits or reset-to-preset with confirmation-free obvious action. Preset switch cleanly changes all tokens; mode switching preserves each mode's edited values.
4. Export validated CSS custom properties and JSON; import JSON <=32KiB with strict schema, reject extra dangerous properties/name injection. Theme names rendered as text and never interpolated into CSS selectors.
5. Local save uses versioned validated data, storage failure warning and reset fallback. Keyboard/mobile/reduced-motion support.
6. Optional suggest readable foreground can choose black/white by greater actual contrast; explicitly applies on click, never silently modifies user palette.
7. CSS export has predictable scope (:root or data-theme selector using known enum only), semicolon-safe validated values and sufficient docs to reproduce preview.

## Acceptance tests
- P1: black/white21:1, same color1:1, known WCAG pair; piecewise threshold and ratio symmetry.
- P2: AA threshold compare unrounded; invalid hex, NaN and out-of-range scale rejected.
- P3: preview pair definitions match exported tokens; import/export roundtrip; malicious name cannot inject CSS.
- P4: separate mode edits persist, preset/reset/undo redo behavior; corrupt storage recovers.
- P5 browser: change picker/hex/scale, create failing contrast, apply foreground suggestion, toggle mode, export and reimport.
## Documentation
WCAG formula/source, assessed pairs, normal/large-text distinction, limits of contrast-only checks, token integration example, architecture and asset provenance.

## Completion gate
Implement the behavior and acceptance tests above; document any deliberate limitation. `npm run check` and `npm run test:e2e` must pass. Independently review the code and exercise the production build before release. Verify the public demo at its GitHub repository subpath.

## Refinement behavior: act on contrast and export a pair

Each contrast assessment offers an Edit color action that focuses and scrolls to the exact foreground field. A failing pair previews black/white suggestions against every measured background sharing its foreground. Choose the candidate maximizing the minimum raw ratio, with black as the deterministic tie-break. Offer Use only when all affected measured pairs meet normal AA using unrounded ratios. Explain when neither candidate can satisfy all pairs; do not claim no other color could work. Applying a suggestion is one ordinary token edit with undo, persistence and async-import fencing. Other modes remain independent.

Download both modes produces a CSS file containing the validated light selector followed by the validated dark selector, using committed state in each mode. Existing single-mode CSS/JSON formats and import schema do not change.

Acceptance: repair a white-on-white shared text token, verify both measured surfaces and undo; opposite black/white surfaces must show an explanation without a misleading repair; mobile Edit color reaches/focuses the field; a downloaded pair contains both independently edited colors and exactly two fixed selectors.

## September iteration: portable workspace backup

Back up workspace exports a strictly validated version-1 Workspace JSON containing both mode themes, active mode and preset identity. The existing Import JSON input accepts a Theme or a complete Workspace, chosen by exact top-level schema; unknown, hybrid, wrong-version or mismatched-mode objects fail without partial changes. The same 32 KiB byte limit applies before file reading and after text decoding. A workspace import is one undoable replacement, resets visible drafts and retains the existing async generation fence. Single-theme JSON imports remain backward compatible and preserve the other mode. Backup includes committed values only, excludes undo history/drafts, and never uploads data.

Acceptance: download actual JSON, change both modes, import/undo/redo/reload exact roundtrip; malformed workspace and delayed import cannot overwrite newer intent; schema, byte bounds and identity validation have domain tests. Source and Engineering walkthrough links are visible in the footer.


## Accessibility and human usability — 23 September 2026

The supported keyboard paths, error recovery, readable controls and layout states are specified in [ACCESSIBILITY.md](docs/ACCESSIBILITY.md). New browser regressions exercise these outcomes alongside existing domain and security boundaries. No remote service, data format or resource limit changes are introduced.

At 320px, doubling the computed size of headings, labels, control text and supporting copy must preserve page reflow even while a theme-name error is visible. The user must still restore the name with Escape and edit a hex value by keyboard. The unfocused skip link must stay visually clipped regardless of scroll position or text size, and become fully visible when focused.
