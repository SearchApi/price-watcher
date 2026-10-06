# Price Watch verification

Checked September 28, 2026. Local implementation only; no website or video publication.

## Automated and browser checks

The complete local hub suite passed **48/48 checks**, including **10 Price Watch tests**.

- Ten Price Watch tests cover price/currency parsing, provider-shape handling, explicit variant confirmation, offer identity, persistence, failed or mismatched refreshes, changed seller sets, archive/restore and the HTTP boundary. Records are fictional test fixtures.
- The project hub checks include exact source/UI copy matching, routing, private-file exclusions and an honest capture-pending status.
- Browser workflow verified with an isolated temporary workspace and a visible “TEST FIXTURE” banner: search, inspect, confirm two matching offers, save a baseline, refresh, edit the reference price (field since removed), reload, export action, archive and restore.
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

## October 5, 2026 update

Added since the September 28 record: automatic checks every 24 hours, a usage panel that reads SearchApi's account endpoint, limits in the environment file, a per-product target price, email alerts through Resend and a price history chart with one line per confirmed listing.

- **Automated:** 30 Price Watch tests and 68 checks across the Content Machine passed. They use fictional records and simulated providers, including the scheduler, pause on a spent allowance, usage estimates, target and change alerts, and the chart's series logic.
- **Visual:** the chart, tooltip, legend, table view and usage panel were inspected with fictional data in light, dark and phone-width layouts, including direct end labels and a gap in a line.
- **Live data:** the key replaced on September 30 reached SearchApi and three Shopping searches were saved. The account endpoint returned the account's remaining searches. No product baseline, real price history or later observation exists.
- **Not verified:** a real Resend delivery (no key configured yet), a real alert from a real price change, the free-plan flow from a new account and a clean clone of a viewer repository.
- **Repository:** one local commit exists. The private repository in the SearchApi organization could not be created with the current permissions.

Later on October 5, 2026: the selling-price field and the “above the lowest” comparison and alert were removed at Gabs’s request. The target price remains. 31 Price Watch tests pass after the change.

Later on October 5, 2026: usage, automatic checks and email moved from the sidebar to a Settings page; the check interval became a saved setting (1 hour to 7 days); demo mode (`npm run demo`) was added with simulated daily checks on a separate copy of the workspace. 36 Price Watch tests pass, including the interval and the simulation. Demo mode was run once against a copy of the real watchlist with email off: four simulated days, the fourth reaching the target. A real test email through Resend was delivered to the configured address the same day. Six product candidates were checked with real searches to pick examples for the script (12 requests).
