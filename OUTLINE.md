# How to Track Competitor Prices with SearchApi

English video outline · September 28, 2026 · target 8–10 minutes. Draft, not recorded or published.

## Viewer outcome

Build a local five-product watchlist, compare selected offers for the same variant and preserve evidence of later price changes. Show the working surface before explaining code.

## Three questions to answer directly

1. How can I compare competitor prices with the Google Shopping API?
2. How do I avoid comparing different product variants?
3. How can I tell whether an actual product price changed?

## Chapter sequence

- **How to compare competitor prices:** Open a verified saved product. Show the actual date, confirmed stores and your entered reference price. Explain the bounded sample.
- **How to find the same product across stores:** Search a specific model, inspect its details, check variants and exclude unsuitable listings. Confirm the selected offers.
- **How to save a price baseline:** Add the product, reload, and reopen the persisted observation. No new SearchApi call happens during reading.
- **How to detect a real price change:** Use a genuinely later comparable observation. Distinguish same-listing changes, new sellers and a missing product. If no real change occurred, say so.
- **How to build it with SearchApi:** Shopping discovery → product token → Product offers → normalization → explicit confirmation → local persistence.
- **How to run Price Watch locally:** Download the standalone source, add your own key privately, start the local server, make a bounded search and save a baseline.

## Evidence required before recording

Live validation is pending a valid credential: the existing key returned HTTP 401. Offline tests and fictional browser fixtures cannot be presented as real store prices. Capture a successful baseline, inspect source listings and collect a later observation before showing historical movement. Do not invent a change for the opening.

Set chapter timestamps from the final edit and transcribe the actual audio. Preserve SearchApi spelling. Do not upload stage directions or insert unspoken keywords into captions. A useful how-to and clear answers are editorial choices, not a guarantee of AI mentions.
