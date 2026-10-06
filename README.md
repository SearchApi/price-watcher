# Price Watch

A local competitor-price workspace built with SearchApi. Find a product, inspect its offers, confirm the exact variant and keep a dated price history. All interface and project materials are in English.

## Run the complete app

Requires Node.js 22.12 or newer (`node -v`). There are no package dependencies to install.

```sh
git clone <this repository> price-watch && cd price-watch
cp .env.example .env
# Set SEARCHAPI_API_KEY in .env (your own SearchApi key). Email is optional: see "Email alerts".
npm start
```

Testing it for the first time: search for an exact model (for example `Logitech MX Master 3S graphite`), inspect a result, tick the listings that are the same variant, add it with a target price, then open **Settings**. Each search and each inspection uses one SearchApi request; a check uses up to two. `npm run demo:fresh` starts a separate demo copy on port 5194 where **Simulate next day** fakes the daily checks (see "Demo mode").

Open http://127.0.0.1:5192/ . The server binds to loopback only. The downloaded source starts with an empty watchlist; it does not include the author's key or private records.

In the Content Machine, use **Projects → Price Watch → Open Price Watch** at http://127.0.0.1:5188/#project/price-watch . The local central server also supports the project's existing private key-file configuration. A process environment key takes precedence, then this project's `.env`, then the central private setting. Reload the page after updating a file-based key; restart if you changed the process environment.

## Use the workspace

1. Search for a specific model and market. Each action retrieves one Google Shopping page, keeping up to 30 inspectable candidates. The search interface language is English; returned product names are preserved.
2. Inspect a candidate. Google Product uses its current `product_token` to retrieve product details and up to 40 returned offers. No merchant page is scraped by this app.
3. Check model, capacity, color, size, condition and bundle. Select matching offers, describe the confirmed variant in your own words and optionally set a target price. At least one selected offer is required to establish a baseline.
4. Follow up with **Check prices**. The app searches again for the same product ID and candidate title to obtain a fresh token. A missing match or changed detail title preserves the previous observations and displays a notice.
5. Existing confirmed listings stay selected only when seller, canonical URL, title, condition and currency still match. New listings need review. Source grouping and titles do not guarantee that the product variant is identical; review the listing before relying on it.
6. Use **Save offer selection** to change which listings count in the latest observation. Previous observations retain their original selections. **Set a target price** (or **Edit target price**) changes only your target; it does not change the observed store prices.
7. Archive products to make space without deleting their history. Restore from the sidebar. Export history downloads a JSON copy of saved products, selections and source references, without provider tokens or credentials.

## What the numbers mean

- **Lowest confirmed offer:** the smallest item price among your confirmed offers in the latest observation. It is not the cheapest price across the whole market.
- **Target price:** an amount you enter, in the same currency. The app marks it as reached when the lowest confirmed item price is at or below it, and emails you the first time that happens if email alerts are on.
- **Price changes:** before/after amounts for the same confirmed listing in adjacent observations. A different or missing seller is not reported as a price change.
- **Price history chart:** by default one line per confirmed store listing, so you can see which seller moved. Switch to **Lowest** for the lowest confirmed price per observation (its seller set may change). A listing that was not confirmed or not returned in an observation leaves a gap in its line; gaps are never drawn as zero. Up to six listings are drawn; the table view lists every confirmed listing. Hover or use the arrow keys to read the values at an observation. Colors follow the listing, not its rank.
- All comparisons use item prices before shipping and tax. Delivery information is shown separately when returned. Unknown delivery stays unknown. Checkout pricing and availability can differ.
- This version is for new products. Explicit used/refurbished, unavailable, installment and ambiguous-currency offers are excluded. Unknown condition still needs human confirmation. Returned prices are rounded to integer cents for calculations. No currency conversion runs.

## Bounds, storage and privacy

Five active products by default (configurable); up to 30 including archives; up to 60 observations per product by default. Search and inspection actions make one request each. A check makes at most two requests, with no pagination or automatic retry. The server limits provider requests per hour (your account's own hourly limit when SearchApi reports it, otherwise 30) and checks of the same product to at least one minute apart.

Checks run automatically while the server is running, one product at a time and up to two requests per check. Open **Settings** to turn them on or off and to choose how often: every hour, 3, 6 or 12 hours, every day, every 2 days or every week. The choice is saved with the workspace; `PRICE_WATCH_CHECK_HOURS` only sets the starting value. You can also press **Check now** on a product at any time. Other limits (`PRICE_WATCH_MAX_PRODUCTS`, `PRICE_WATCH_MAX_OBSERVATIONS`, `PRICE_WATCH_HOURLY_LIMIT`) are set in `.env` (see `.env.example`). There is no Slack delivery, automated repricing, account system or public deployment in this version.

## Email alerts

Optional. Create a free [Resend](https://resend.com) account and API key, then set **both** `RESEND_API_KEY` and `ALERT_EMAIL_TO` in `.env` and restart. With only one of them, email stays off and **Settings** says so. The default sender (`onboarding@resend.dev`) only delivers to the email address of your own Resend account; to send elsewhere, verify a domain in Resend and set `ALERT_EMAIL_FROM`. Press **Send a test** in **Settings** to confirm.

After each saved observation (automatic or manual) you get one email when a confirmed listing changed price compared with the previous observation, or when the lowest confirmed offer first reaches your optional **target price** (it fires once, not on every check while the price stays below the target). Nothing is sent when nothing changed, when a product is not found, or when a check fails. A failed email never affects the saved observation; the error appears in **Settings** and as a short notice in the sidebar. Emails contain item prices only, observed before shipping and tax. Turn alerts off in **Settings**. Sending uses Resend, not SearchApi, so it does not use your searches.

## Usage and credits

**Settings** shows your real balance from SearchApi's account endpoint (`GET /api/v1/me`): searches used and left this month. It also estimates what your watchlist costs per day (products × 2 requests × checks per day) and how many days your balance covers. Five products checked daily use about 10 requests a day, so a free allowance of 100 searches lasts roughly ten days; checking every hour uses 24 times as much. When the allowance is spent, automatic checks pause, the sidebar shows a notice and Settings links to the [SearchApi plans](https://www.searchapi.io/pricing). Saved history is never lost. If the account endpoint is unreachable, Settings says so and the rest of the app keeps working.

## Demo mode

`npm run demo` starts a second copy on http://127.0.0.1:5194/ for rehearsals and recordings. It copies your real watchlist into `private/demo-state.json`, moves its history four days back and replaces **Check now** with **Simulate next day**. Searching, inspecting and adding products still work in demo mode and still use real SearchApi requests; only the checks are simulated. Each press adds one simulated day: quiet days, one small move, and on the fourth day a cut by the cheapest confirmed store (down to your target when the target is within about 12%, otherwise 5%). Demo mode makes no SearchApi request for checks, runs no schedule and never changes your real watchlist. Simulated observations are marked in the table and tooltip, the page shows a banner, and alert emails carry `[Simulated]` in the subject and a notice in the body. The stores are real and the simulated prices are not, so do not present them as real. `npm run demo:reset` clears the demo copy. `npm run demo:fresh` clears it and starts demo mode with an empty watchlist, for a one-take recording: search, confirm and save happen live (real SearchApi requests), then **Simulate next day** adds simulated days to the product you just saved. The yellow banner appears as soon as a product has simulated checks; a small Demo tag is always visible in the header.

State is written atomically to `private/state.json` outside the served directory. Actions are serialized per server process and guarded by state revisions. Run only one server process against a given state file. The central and standalone entry points share the same local project state; stop one before running the other.

Keys stay on the local server and are sent to SearchApi in an Authorization header. Provider product tokens remain in private search caches and are omitted from browser responses and exports. Only loopback hosts and same-origin requests are accepted, and writes require an action token. This is a single-user local tool, not a production multi-user service.

## Validate

```sh
npm test
```

Tests use explicitly fictional records. They cover currency/price ambiguity, unsafe links, variant review, persistence, identity drift, failed refreshes, stale revisions, comparable changes, archive/restore and cross-site protections.

Live validation on September 28, 2026 reached SearchApi but the key then in use returned HTTP 401. After the key was replaced on September 30, three live Google Shopping searches succeeded. No product baseline, real price history or real email alert has been saved or claimed yet. Configure your own key privately before recording real results. See `VERIFICATION.md` for the validation record.

## Implementation map

- `model.mjs`: normalization, price validation, offer identity and comparison rules.
- `store.mjs`: provider requests, bounded collection and atomic private storage.
- `http.mjs`: local HTTP boundary, action token and request limits.
- `server.mjs`: standalone server, private-file boundary and scheduler start.
- `scheduler.mjs`: automatic checks, backoff and pause when the account is out of searches.
- `config.mjs`: limits read from the environment.
- `simulate.mjs`: demo mode (simulated daily checks on a separate copy of the workspace).
- `examples/requests.sh`: the two SearchApi requests (Google Shopping, then Google Product) as plain curl + jq, to build your own tool from.
- `alerts.mjs` and `notify.mjs`: what is worth an email, and the Resend sender (replace `notify.mjs` for another provider).
- `public/`: English interface, responsive styles and favicon. `history-chart.js` builds the price history chart and its table view.
- `SCRIPT.md`: the demo script, with suggested text and the on-screen flow.

Sources checked September 28, 2026: [Google Shopping](https://www.searchapi.io/docs/google-shopping), [Google Product](https://www.searchapi.io/docs/google-product), and the public [SearchApi price-monitoring workflow](https://n8n.io/workflows/17821-monitor-competitor-prices-from-google-shopping-via-searchapi-with-google-sheets-and-slack/). Since May 2026, Google Product requires a fresh-format `product_token` obtained from Shopping; this project does not call it with only `product_id`.
