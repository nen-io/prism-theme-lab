# Verification

## Executed checks

Executed locally on 17 September 2026 with Node 24.19.0, npm 11.17.0 and exact dependencies in the lockfile:

| Check                     | Result                                                                                                                                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`           | Strict TypeScript checking, 12 Vitest tests and production Vite build passed                                                                                                                                                                    |
| `npm run test:e2e`        | 12 Chromium journeys passed                                                                                                                                                                                                                     |
| Responsive checks         | No horizontal page overflow at 320px or 720px with root text size doubled; keyboard mode switching, focusable/scrollable CSS export preview and reduced-motion media exercised                                                                  |
| Screenshot review         | Actual populated desktop 1440px and mobile 390px captures generated and visually inspected                                                                                                                                                      |
| Independent parent review | Found shell text contrast/size and same-value reset-draft issues; both corrected with styling and a dedicated browser regression; follow-up axe found no contrast issues, and its scrollable-code focus finding was fixed and regression-tested |

These are executable checks and sampled visual review, not certification of overall accessibility or production security. No permanently skipped tests or placeholder assertions. Vitest excludes Playwright files.

## Acceptance map

| Requirement                             | Tests and observed behavior                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1: WCAG math                           | Black/white 21:1, equal colors 1:1, known gray pair, pure red luminance, symmetry and exact 0.04045 transfer threshold                              |
| P2: unrounded thresholds and validation | 4.4999 remains fail despite display rounding; malformed hex, NaN/infinite/out-of-range scale and unsupported versions rejected                      |
| P3: pairs and export                    | Pair table tied to tokens; CSS and JSON roundtrip; names excluded from CSS; actual preview computed background/text/button styles asserted          |
| P4: history/modes/storage               | Independent light/dark edits survive mode switches and reload; undo/redo and preset/reset behavior; 50-step bound; corrupt/blocked storage recovery |
| P5: interactive workflow                | Picker/hex/scale changes, explicit contrast failure, foreground suggestion, both mode edits, downloaded JSON/CSS inspected, JSON reimported         |
| Adversarial input                       | Malicious name/selector and unknown keys rejected; oversized file rejected before read; HTML-like preview text produces no HTML element             |
| Async authority                         | File.text deliberately delayed; newer preset chosen; old file cannot replace it after completion                                                    |
| Draft authority                         | Invalid hex reset clears error even when committed preset was unchanged; invalid name cleared by explicit preset selection                          |

All six preset/mode combinations are checked against the four normal-AA pairs. This verifies their color ratios, not other semantics or interaction states.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run check
npm run test:e2e
```

Focused cases:

```sh
npx vitest run tests/theme.test.ts -t 'compares raw ratios'
npx playwright test -g 'delayed file read'
npx playwright test -g 'explicit reset clears invalid drafts'
```

The browser storage tests inject malformed data or a throwing localStorage getter into the test context. They verify a visible warning, safe fallback and continued editing. The import race test delays an actual File.text call then uses the real preset control before allowing the read to resolve. It does not replace domain validation with a mock result.

## Screenshot artifacts

- `docs/screenshots/desktop.png`: 1440px viewport, default Orchard light palette, working preview and all four pair assessments.
- `docs/screenshots/mobile.png`: 390px viewport, same populated application, full page.

The screenshot Playwright journey captures these from a running app. They are documentation images, not a pixel-diff baseline. Screenshots were regenerated after raising supporting type to at least 11px in the studio and correcting secondary-text colors. The editor itself uses fixed colors while the inspected preview still follows user tokens.

## Evidence limits

Chromium is covered. Safari/Firefox, native mobile pickers on physical devices and assistive-technology interaction were not tested. The 200% check changes the root font size to 32px; it is a layout stress check, not a claim of testing every browser zoom behavior. Keyboard smoke does not establish a complete screen-reader audit. Default preview colors pass measured text pairs, but users may deliberately create contrast failures. No penetration test, performance benchmark, long-duration storage test, cloud collaboration or multi-tab conflict-resolution test was performed. No network upload exists to validate. Deployment and final independent review are separate gates owned by the publishing workflow.

## Independent release review

The studio shell passed the follow-up axe WCAG 2/2.1 AA scan with zero reported violations. Supporting typography was increased, and the CSS export region now accepts keyboard focus for horizontal scrolling. A production meta CSP was added and is checked separately from development. Two added browser regressions prove that a pending file read cannot discard a newer uncommitted color or theme-name draft. The full check and all twelve Chromium journeys passed after these changes.

## Refinement verification

Twelve domain tests and twelve Chromium journeys pass after refinement. Added coverage checks shared foreground repair across page/card surfaces, exact field focus/navigation, undo, the explanatory state when black/white cannot pass both surfaces, mobile no-overflow/focus, and downloaded CSS containing both independently edited palettes. The domain regression proves the helper preserves the input, uses every shared pair and does not promise an impossible black/white repair. Existing malformed import, pending draft authority, persistence, contrast threshold and security journeys remain green. Both-mode CSS uses the same validated export implementation as the original single-mode output.
