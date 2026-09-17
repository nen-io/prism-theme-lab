# Scalability and limits

Prism is a local, fixed-size editor. There is no server throughput claim or benchmark result. Actual implemented bounds are deliberately small enough to reason about and inspect.

## Implemented resources

| Resource             | Bound / behavior                                                                        |
| -------------------- | --------------------------------------------------------------------------------------- |
| Theme                | Exactly seven opaque hex colors, one display name, one mode and one scale               |
| Name                 | 1–48 Unicode letters/numbers/simple punctuation characters; invalid names do not commit |
| Scale                | Finite 0.85–1.40; out-of-range values rejected                                          |
| JSON import          | 32 KiB before file read and before parse; larger content rejected                       |
| Stored workspace     | One versioned light/dark workspace; 32 KiB read bound and full schema validation        |
| History              | At most 50 undo snapshots and 50 redo snapshots; new commits clear redo                 |
| Preview project text | One current project, 80-character input; session-only and replaced on submit            |
| Contrast checks      | Four declared pairs per render; three fixed threshold comparisons per pair              |

The UI renders a fixed collection of controls/components. Theme copy and validation are O(t) for t=7 tokens. Contrast is O(p) for p=4 pairs, each requiring two luminance calculations over three channels. JSON parsing is O(b) for b≤32 KiB. History stores O(h·t) token data with h≤50. localStorage writes serialize only the current two-mode workspace; history is not persisted. Snapshots share unchanged immutable structures in memory, but cost remains bounded even if all edits replace both modes.

Slider and native-picker input can generate frequent committed edits. Each commit is small, but it does consume a history slot and makes a synchronous localStorage write. Browser writes may block briefly; no performance claim is made. There is no cache that can hide authoritative theme state and no network queue to drain.

## At 10×: proposed, not implemented

For 70 tokens or 40 assessed pairs, group tokens semantically, add searchable groups and compute each unique luminance once per token. Keep the pure model and explicit pair definitions. Measure browser interaction latency and actual storage time before introducing memoization. Debounce persistence separately from visible preview updates, flush on page lifecycle boundaries and surface save state accurately. Avoid turning debounced saving into an unreported data-loss window.

For hundreds of history edits, store patches or coalesce one slider gesture into one undo unit rather than increasing full-snapshot caps blindly. Add automated interaction profiles on low-powered hardware before claiming smoothness.

## At 100×: proposed, not implemented

A 700-token, multi-brand editor should separate semantic aliases from resolved colors, detect alias cycles and assess component/state-specific pairs. Paginate or virtualize long inspection lists; use a worker if real measurements show validation/analysis blocks interaction. Large files need explicit schema migrations and stricter byte/complexity budgets, not a removed limit.

Cloud collaboration would introduce fundamentally new trust and consistency boundaries: authenticated projects, authorization, versioned server documents, optimistic concurrency, audit/restore history and explicit conflict resolution. Last-write-wins localStorage would be inadequate. Avoid a shared token cache as an authority; derive exports from a specific document revision. No such cloud, queue, database or collaborative mode is implemented.

## How to measure responsibly

A useful future benchmark would record browser/version, CPU/device, token/pair/history counts, input trace, cold/warm conditions, interaction latency percentiles, memory and persistence failures. The current build and test durations do not measure user-facing capacity and are not presented as performance evidence.

## Refinement resource cost

The suggestion helper evaluates two candidates across the existing four measured pairs. Related-pair scanning remains a fixed small bound; it introduces no palette search or background work. Exporting both modes creates at most two fixed-size token blocks in one Blob, with the existing URL revocation lifecycle. Theme/history/import limits are unchanged.
