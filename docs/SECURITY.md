# Security model

## Assets and boundaries

The assets are the user's locally edited theme, safe export bytes, localStorage workspace and a usable editor. The app has no accounts, backend, credentials, server-side sessions or business database. That avoids server authentication, request authorization and database-injection surfaces; it does not make imported files or persisted values trusted.

Threats considered: a malicious JSON file, malformed/corrupt stored state, an oversized input, an obsolete asynchronous import, markup-like user text, and accidental loss of local persistence. The browser, installed dependencies, deployed JavaScript and origin-level execution are trusted. Malicious extensions, compromised application scripts and someone with device/storage access remain outside the protected boundary.

## Threats and evidence

| Threat                                         | Implemented control                                                                                                                     | Matching tests                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| CSS selector/value injection                   | Fixed selector derived only from `light`/`dark`; names excluded; six-digit opaque hex; finite bounded numeric scale; exact property set | Malicious names/modes/extra properties rejected; CSS export mapping and name-exclusion assertions |
| HTML/script injection                          | React text nodes for names, messages and sample project text; no innerHTML/eval                                                         | Browser HTML-like project name stays text, no image element created                               |
| Prototype pollution                            | Exact plain-object schema and allowed keys; unknown `__proto__` rejected; no arbitrary key merge                                        | JSON prototype-property rejection and strict schema tests                                         |
| Oversized or deep imported data                | 32 KiB file check before read, UTF-8 byte check before JSON parsing; fixed shallow schema rejects nested token values                   | Oversized file/text imports and invalid nested/array structure rejection                          |
| Stale asynchronous import overwrites user edit | Generation fence invalidated by every newer editor action/import and unmount                                                            | Delayed File.text completion vs newer preset browser regression                                   |
| Corrupt or future storage                      | Version/shape validation of entire workspace and both mode slots; safe preset fallback with warning                                     | Malformed, oversized, extra-property and unknown-version storage tests                            |
| Denied localStorage / quota failure            | Storage getter and reads/writes wrapped; editor works in memory; export remains available                                               | Blocked getters/writes unit tests and browser denied-storage journey                              |
| History/resource growth                        | 50 past/future snapshots; seven tokens; bounded names, scale and file sizes                                                             | History-cap test and input-bound tests                                                            |

A theme may intentionally choose poor contrast. That is not executable code and is allowed: failing contrast must remain observable. The editor chrome does not inherit user colors, and only explicit user action applies suggestions.

## Browser security policy

Runtime uses bundled same-origin assets, system fonts and CSS-created shapes. No analytics, third-party fonts, external images, provider requests, remote imports or uploaded data. Import selects a local file; export creates a short-lived Blob URL and fixed mode-based filename. Import does not trust the filename or MIME type as content validation. No URL parameters are read into application state.

The production build injects a meta Content Security Policy: scripts and assets stay same-origin, network connections are denied, and objects, base URLs and form submissions are disabled. Inline styles remain allowed because the preview applies validated CSS variables. The preview form handles submit locally with preventDefault. Blob downloads remain local. The static hosting platform controls HTTP headers; meta CSP cannot enforce `frame-ancestors`, which requires a host response header. Development HMR is separate from this production-only policy.

## Residual risks

- localStorage is not encrypted, not a backup and not protected from other JavaScript on the same origin. Do not store secrets in theme names or sample project text.
- Multiple tabs use last-write-wins snapshots without synchronization, conflict detection or merge. Download JSON for durable transfer.
- Browser extensions or compromised same-origin scripts can access local content. Dependency pinning makes builds reproducible but does not establish safety.
- A cancelled import may finish reading bytes; the generation check blocks its commit. At 32 KiB this resource usage is bounded.
- Palette contrast checks cover four text pairs only. They cannot certify non-text contrast, focus treatment, perception, semantic markup or a consumer application.
- No penetration test, supply-chain audit or formal security proof has been performed. `npm audit` is only an advisory database check.

## Reporting

Once published, use repository issues for non-sensitive problems. For a sensitive vulnerability, use GitHub private vulnerability reporting if enabled; otherwise request a private channel from the maintainer without posting secrets or exploit details. No unverified contact address is invented.

## Refinement boundaries

Contrast suggestions are derived from validated tokens and return only hardcoded black/white values; no supplied string becomes markup, a selector or an executable style rule. Both-mode export independently validates both themes through the existing export boundary before creating a download. The new field-navigation action uses only the fixed token-key set. No clipboard, network access or new dependency is introduced.
