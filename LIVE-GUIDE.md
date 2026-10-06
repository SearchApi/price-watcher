# Price Watch — recording and walkthrough guide

English editorial draft · September 28, 2026. Working title: **How to Track Competitor Prices with SearchApi**. Follow OUTLINE.md for the chapter sequence and README.md for exact setup instructions.

## Recording status

The app is implemented locally. A live request reached SearchApi but the existing credential returned HTTP 401. Use the app for implementation review; record market results only after collecting and checking a real baseline. No synthetic price, merchant or historical change is a market finding.

## 1. How to compare competitor prices

Screen: a saved product with its actual market, timestamp and confirmed offers. Open the source listing for the lowest confirmed item price.

Say: “To compare competitor prices with SearchApi, first search Google Shopping for a specific product, then use the returned product token to retrieve its store offers. Price Watch lets you confirm which listings match the same variant and compare those item prices with your own selling price. The result is a dated comparison of the offers we retrieved, not a guarantee of the lowest price anywhere.”

Show the item-price basis. Delivery and tax are excluded from the comparison, and checkout may differ. If no real baseline exists yet, demonstrate setup first rather than substituting test records.

## 2. How to confirm a product match

Screen: Find a product → enter the exact model and choose market → Search → Inspect offers. Compare the candidate and product-detail titles, then review listing titles and sources.

Say: “A lower price is only useful if we are comparing the same product. I check the model, capacity, color, condition and bundle before selecting an offer. Price Watch excludes explicit used products, unavailable listings and ambiguous prices, but that does not replace a product check. New listings remain unconfirmed until I review them.”

Enter a variant description and optional selling price. Explain that the selling price is your input, not a SearchApi observation. Confirm the selection and save it.

## 3. How to save a baseline

Screen: reopen the watchlist after reload. Show the first observation and its source-linked offers.

Say: “This is our baseline. It stays on the local server, so reopening the app does not repeat the search. There is only one observation so far. We cannot claim a price trend until we have later evidence.”

Explain five active products, reversible archive and history export. Show that reads and selection changes use saved data.

## 4. How to identify a price change

Screen: click Check prices only when another observation is useful. Show a real later result with the same product identity. Review any new offers.

Say: “Price Watch checks the product identity again before saving another observation. It reports a price change only when the same confirmed listing appears in both observations. A new cheaper store changes the available comparison, but it is not the same as an existing store cutting its price. A missing result is not proof that the product is out of stock.”

The history line tracks each observation's lowest confirmed item price; its seller set can change. Use the per-listing before-and-after highlights for actual comparable changes. If prices did not change, demonstrate that honest result. No checks are scheduled automatically.

## 5. How to build the workflow

Screen: show the request shapes, then model.mjs and store.mjs. Keep credentials and provider tokens out of recordings.

```json
{
  "engine": "google_shopping",
  "q": "Logitech MX Master 3S black",
  "gl": "us",
  "hl": "en",
  "link": "resolved"
}
```

```json
{
  "engine": "google_product",
  "product_token": "TOKEN_FROM_THE_SELECTED_SHOPPING_RESULT",
  "gl": "us",
  "hl": "en"
}
```

These are request examples, not executed-result claims.

Say: “SearchApi provides the product records and store offers. Our application adds the confirmed match, price comparison, watchlist and saved observations. The provider token is kept on the server, and a check refreshes it through another Shopping search. The app uses integer cents for price calculations and keeps each market in its own currency.”

Show that one search and one inspection are separate calls; checking a saved product takes at most two. No pagination or automatic retry is hidden in the demo.

## 6. How to run it locally

Screen: verify the actual source download from the project page. Follow README.md on a clean copy, put the key in .env off-camera, and open the localhost address. Search and save one verified product.

Say: “The source contains the complete local app. It runs on Node.js without installing third-party packages. Add your SearchApi key privately, start the server and open the localhost address. The key stays on this local server; the browser gets only the product data needed for the interface.”

Close: “Start with one product you know well. Confirm the variant, save a dated baseline and come back for another observation. That is the foundation of a useful price monitor.”

## Before publishing a video

- Verify the source package and a real own-key search from a clean copy.
- Preserve observed date, market, variant and comparison basis on screen.
- Use genuine later evidence for change claims; fictional tests stay labelled as tests.
- Prepare captions from final audio and add chapter times from the edit.
- Keep deployment, recording and video publication as separate statuses.

Sources checked September 28, 2026: [SearchApi Google Shopping](https://www.searchapi.io/docs/google-shopping) and [Google Product](https://www.searchapi.io/docs/google-product).
