# Price Watch verification

Checked September 28, 2026. Local implementation only; no website or video publication.

## Automated and browser checks

The complete local hub suite passed **48/48 checks**, including **10 Price Watch tests**.

- Ten Price Watch tests cover price/currency parsing, provider-shape handling, explicit variant confirmation, offer identity, persistence, failed or mismatched refreshes, changed seller sets, archive/restore and the HTTP boundary. Records are fictional test fixtures.
- The project hub checks include exact source/UI copy matching, routing, private-file exclusions and an honest capture-pending status.
- Browser workflow verified with an isolated temporary workspace and a visible “TEST FIXTURE” banner: search, inspect, confirm two matching offers, save a baseline, refresh, edit the reference price, reload, export action, archive and restore.
- Fictional same-listing movement from $99 to $89 appeared correctly. A new $5 accessory remained unconfirmed and did not become the minimum. This verifies application logic, not a real price change.
- Desktop and 390-pixel mobile layouts inspected. Mobile document width matched the viewport. No browser console errors were recorded during that workflow.

## Download verification

The project-only packaging command produced a valid ZIP containing 21 files. Inspection found no private state, configured credentials, dependency folders or symlinks. A fresh extraction loaded the standalone entry point, served the app, returned an empty watchlist and rejected private-file paths without making provider requests. Its own-key live search remains pending.

## Live-data limitation

A bounded live request reached SearchApi on September 28, 2026 but the existing credential returned HTTP 401. No successful new product capture or real price-history claim was produced. A valid private key and source-listing review remain necessary before recording market results.

Opening the production local workspace does not import browser fixtures. The app starts empty. Manual collection uses one request for search, one for inspection and up to two per refresh. The thumbnail is generated artwork, not price evidence.

## Reproduction

Run `npm test` in the project. For an explicitly fictional browser rehearsal, run `node tests/browser-preview.mjs` and open the temporary local address printed by the server. It uses a separate temporary state and no SearchApi connection. Stop it when finished.

For real data, follow README.md and configure your own key privately. Do not run the standalone server and central server against the same private state simultaneously.
