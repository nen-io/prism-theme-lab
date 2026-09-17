# Prism design study

## Direction

A calm, colorful design studio with an off-white canvas, deep forest typography, restrained orange emphasis and generous editorial spacing. A small multicolor geometric Prism mark introduces the idea of a palette without relying on external artwork. The workbench chrome keeps its own accessible colors; only the isolated product preview responds to edited theme tokens, so a deliberately failing palette never makes the editor itself unusable.

## Desktop composition

A slim brand header contains a local-save indicator and JSON import/export controls. The title “Good taste. Measurable contrast.” sits above a row of three curated palette cards with distinctive miniature color compositions. A workspace toolbar contains the theme name, light/dark switch and bounded undo/redo. Below, a left palette rail exposes seven color tokens with a native picker, readable label and editable hex input. The larger right panel contains a realistic “Sunday” project-space preview: navigation, heading, surface card, primary action, labelled input, helper copy and a working local project creation flow. The preview is framed as a sample interface, not a screenshot or a live external product.

A full-width contrast inspection panel contains four exact pair cards with visible foreground/background chips, ratio, unrounded AA decision and normal/large/AAA criteria. A bottom type-scale control and integration/export area complete the workbench. A failing pair uses words and an outlined signal, not color alone.

## Main journey

Choose a palette; explore its independent light and dark values. Edit a token with its picker or hex draft, then commit on Enter/blur. The preview and measured ratios update together. Make a button unreadable, then explicitly apply the better black/white foreground suggestion. Undo or reset to the selected preset. Adjust type scale, export CSS/JSON, import JSON and reload to confirm local saving. Mode switches preserve prior edits. Import applies to its declared mode and keeps the other mode intact.

## Input and feedback

Partial or invalid hex remains visible as a draft, with an error on commit; canonical committed state stays intact. Names support simple Unicode text up to 48 characters, but reject markup/control characters rather than accepting CSS syntax. All names render as text and never enter a CSS selector. Errors appear near the field and announce politely. Import checks a 32 KiB bound before reading and has a loading state; stale import completions cannot overwrite a subsequent selection. Storage failure leaves the editor usable and shows a warning with a reset option. Corrupt storage loads a safe preset and reports the fallback.

## Mobile, text scaling and motion

At narrow widths the preset row becomes a vertical list, toolbar wraps, and the palette rail precedes the preview; contrast cards stack. All grids allow shrink/wrap at 320px. Controls and headings use rem/em units and content-driven heights. 200% text growth must not clip controls. Every input has a visible label, focus rings are clear, keyboard activation is native, the preview is a labelled region, and status is announced without moving focus. Reduced motion removes decorative transitions. No task depends on animation.

## Contrast refinement

Each assessment now ends with an Edit color action, keeping the measured failure connected to its control. Failing cards show a warm inset explanation of the candidate and shared token effects; the main palette stays fixed-color and legible. The mobile jump focuses the exact field and brings it into view, with reduced-motion support. A third export control packages both modes without disrupting the existing active-mode controls. `screenshots/contrast-repair.png` shows a deliberately failing shared text token before the explicit correction.
