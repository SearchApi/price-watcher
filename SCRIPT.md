# How to Track Competitor Prices with SearchApi

Price Watch demo script · revised October 6, 2026 · one continuous take · about 13 minutes

Camera records you to the SD card; OBS records the screen. Everything happens live, in order. **Do** is what you click or type. **Say** is suggested text: read it or say it in your own words. Values in [brackets] are what you see on the day. All in English.

**Angle (from Sam’s review):** the API first, then what you can do with it, then the tool as one way to do it. Someone who never opens Price Watch should still leave knowing how to get every store’s price for a product with two requests.

**Screens, in order:** camera → terminal (scenes 1–2) → camera (3) → browser, the app (4–9) → editor (10) → camera (11).

## Setup (before pressing record)

1. `.env` in the Price Watch folder has `SEARCHAPI_API_KEY`, `RESEND_API_KEY` and `ALERT_EMAIL_TO`.
2. **Terminal A, off camera:** `cd ~/GabsOS/searchapi/price-watch && npm run demo:fresh`. Leave it running and minimize it. This starts a clean demo workspace on http://127.0.0.1:5194/: searches and saves are real, only the daily checks will be simulated.
3. **Terminal B, the one on camera:** large font, dark theme. Run this, then nothing else until scene 1:

   ```
   mkdir -p ~/pw-demo && cd ~/pw-demo && export $(grep SEARCHAPI_API_KEY ~/GabsOS/searchapi/price-watch/.env | xargs) && clear
   ```

   The key is now in the environment; it never appears on screen. Keep the two commands from scenes 1 and 2 ready to paste.
4. **Browser:** the app at http://127.0.0.1:5194/ (empty watchlist, small **Demo** tag in the header), the SearchApi docs for Google Shopping and Google Product, and your inbox. Close everything else.
5. **Editor:** `examples/requests.sh`, `store.mjs`, `scheduler.mjs`, `alerts.mjs` and `.env.example`. Never the real `.env`.
6. **Rehearsed already?** Run `npm run demo:fresh` again in terminal A and `clear` in terminal B before the real take. Each run of scenes 1–2 uses 2 SearchApi requests; scene 4 uses 2 more.

What to expect (checked October 6). Results change from call to call, even minutes apart, so never promise names or counts that are not on screen:

- Scene 1 returns about **40** results. The “Logitech MX Master 3S for Business Mouse” entry was among the first five both times, with a headline price of $109.99.
- Scene 2 returned **3 or 4 stores** (Target, Best Buy, Staples, sometimes CDW), $109.99 to $119.99, plus a typical range of **$90–$120**.
- In the app (scene 4) the same product once showed a fifth listing, **Lenovo “Brown Box”**. It may or may not appear.
- The target is the one number to adapt: **about 5% below the lowest price you see** (with $109.99, use **$105**).

## 0. Opening (45 seconds, camera)

**Say**

“Every store that sells a product is listed on Google Shopping, with its price, right now. If you sell that product, or you’re shopping for it, that list is the answer to ‘where do I stand?’. The problem is that it lives inside a web page.

“I’m Gabs, developer advocate at SearchApi. SearchApi turns Google results into structured data, and today I want to show you two of its APIs: Google Shopping and Google Product. With two requests you get every store’s offer for a product as JSON. Then I’ll show what you can do with that: compare, monitor, get alerted. And I’ll show the small tool I built on top of it, in case you’d rather use one than write one.

“Let’s start with the data.”

## 1. Request one: find the product (1 minute 30 seconds, terminal)

**Do**
1. Paste and run:

   ```
   curl -s -G https://www.searchapi.io/api/v1/search \
     -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
     --data-urlencode engine=google_shopping \
     --data-urlencode "q=Logitech MX Master 3S graphite" \
     --data-urlencode gl=us > shopping.json
   ```

2. Point at `engine=google_shopping`, `q` and `gl` in the command.
3. Paste and run:

   ```
   jq '.shopping_results[:5] | map({title, price, seller, product_token: (.product_token[:12] + "…")})' shopping.json
   ```

4. Point at the **“for Business”** entry: `title`, `price`, `seller`, `product_token`.

**Say**

“This is a Google Shopping search through SearchApi. One GET request: the engine, my query and the country, with my key in the header. I’m asking for the Logitech MX Master 3S, graphite, in the US, and saving the answer to a file.

“What comes back is the Google Shopping results page as JSON. About forty products. I’m showing the first five: each has a title, the headline price, the seller Google shows on the card, and this `product_token`. The price here is just a headline; some entries don’t even have one. The token is what matters: it identifies the product, so I can ask for its offers. I want this one, the MX Master 3S for Business.

“The docs list every parameter: language, device, pagination, sorting, price filters. Pick a specific model; a category query gives you a mix.”

## 2. Request two: every store’s offer (1 minute 30 seconds, terminal)

**Do**
1. Paste and run:

   ```
   TOKEN=$(jq -r '[.shopping_results[] | select(.title | test("for Business"))][0].product_token' shopping.json)
   curl -s -G https://www.searchapi.io/api/v1/search \
     -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
     --data-urlencode engine=google_product \
     --data-urlencode "product_token=$TOKEN" \
     --data-urlencode gl=us \
     | jq '{product: .product.title, typical: {low: .typical_prices.low_price, high: .typical_prices.high_price, popular: .typical_prices.popular_choice}, offers: [.offers[] | {seller: .merchant.name, price, total_price, delivery: .delivery_price}]}'
   ```

2. Point at the first line (it picks the token of the “for Business” entry from the saved file), then at `engine=google_product` and `product_token`.
3. In the output, read the offers one by one: seller, `price`, `total_price`, `delivery`. Then point at `typical`.

**Say**

“Second request: Google Product, with the token from the entry I chose. The first line just pulls that token out of the file I saved.

“This one returns the product and its offers: [three] stores, each with the item price, the total with delivery and the delivery promise. There’s a link to each store page too; I left it out to keep this readable. It also returns Google’s typical price range for this product, [$90 to $120], and which store is the popular choice. And there’s more: specifications, reviews.

“That’s the whole pattern. Shopping to find the product and get a token, Product to get the offers. Two requests, and you have what a human gets from opening ten tabs. Save the result with a date, run it again tomorrow, and you have a price history. Everything from here is built on exactly these two calls.”

## 3. What you can do with it (45 seconds, camera)

**Say**

“So what do people do with this? Three things, mostly.

“Compare: if you sell this product, you see where your price sits next to every store, in one call.

“Monitor: run the two requests on a schedule and keep each answer. Now you see who moved, when, and by how much.

“Alert: compare today’s offers with yesterday’s and send a message when a store changes its price, or when the lowest one reaches a number you care about.

“You can write that in an afternoon, in any language. I wrote one in plain JavaScript, no dependencies, and I’ll use it to show the three things. If you’d rather build your own, the two requests you just saw are in the repository, ready to run.”

## 4. The tool: find and confirm (1 minute 45 seconds, browser)

**Do**
1. Switch to the app tab. Type `Logitech MX Master 3S graphite` in **Product name or model**. Click **Search · 1 request**.
2. Find **“Logitech MX Master 3S for Business Mouse”** among the cards (⌘F if needed). Click its **Inspect offers · 1 request**.
3. In the offers table, read the stores and prices.
4. Tick every listing that is the MX Master 3S for Business, graphite, new. **If a listing is something else** (in rehearsal: Lenovo “Brown Box”, a bundle with a keyboard, refurbished), leave it unticked.

**Say**

“This is Price Watch. Search is request one, now as cards. Inspect is request two: the offers for the product I chose.

“Now the step the API can’t do for you: deciding which offers are really the same product. I check model, color, condition and packaging.”

Then **one** of these:

- **If a listing doesn’t match:** “This one from [Lenovo] is a [brown box]: the same mouse, but bulk packaging and a different part number. Not the same thing on sale. If I compare it, my lowest price is wrong, so I leave it out.”
- **If all match:** “Here they’re all the same model, so I keep them all. When one isn’t, a bundle or a different box, I leave it out, because a lower price only matters if it’s the same product.”

“The app already drops used items, unavailable listings and prices it can’t parse. The rest is my call.”

## 5. Save the baseline and set a target (45 seconds, browser)

**Do**
1. In **Variant you confirmed**, type `for Business · graphite · new · retail box`.
2. In **Target price (USD)**, type `105` (or about 5% below the lowest price you see).
3. Click **Add to watchlist**. Point at the two cards: **Lowest confirmed offer [$109.99]** and **Target price $105.00**.

**Say**

“I describe the variant in my own words, so I remember what I’m following, and set a target: a hundred and five dollars, the price I want to be told about. Saved. This is the baseline: [four] confirmed stores, the lowest at [$109.99], observed today. One observation, so no history yet.”

## 6. Monitor: schedule and cost (1 minute, browser)

**Do**
1. Click **Settings** (top right).
2. In **Automatic checks**, open **How often** and point at **Every hour**, **Every day**, **Every week**. Leave **Every day**.
3. Point at **SearchApi usage**: searches left and “about 2 requests a day”.

**Say**

“Monitoring is the same two requests on a timer, and I choose how often: every hour, every day, every week. Each check uses up to two searches per product, so one product once a day is about two a day; five products, about ten. A new SearchApi account comes with 100 free requests, so that’s about ten days of daily checks before you decide whether it’s worth a plan. This card reads my real balance from SearchApi’s account endpoint. If it runs out, checks pause and the history stays.”

## 7. Alert: email (1 minute 15 seconds, browser)

**Do**
1. Still in **Settings**, point at **Email alerts** and the masked address.
2. Switch to the editor, show `.env.example` (the three email lines), switch back.
3. Click **Send a test**. Switch to the inbox, open **“Price Watch test email”**, switch back.

**Say**

“Alerts go by email through Resend: a free plan and one HTTPS call, nothing to install. Two settings: the Resend API key and the address that receives the alerts. Resend’s default sender only delivers to the email of your own Resend account; to send anywhere else, verify a domain and set the sender in the third variable. Test sent, and received.”

## 8. Fast-forward: a price drop (2 minutes, browser)

**Do**
1. Click the **Logitech** in the watchlist on the left. Point at **Simulate next day** and at the **Demo** tag in the header.
2. Click **Simulate next day**. Message: “No price changed.” Point at the yellow banner that appeared and at the new date.
3. Click again. Message: “[Staples] lowered its price slightly.” Point at the highlight under the chart.
4. Click again. “No price changed.”
5. Click a fourth time. Message: “[Best Buy] cut its price.” Point at **Lowest confirmed offer $104.99** and the green **Target reached** card.
6. Switch to the inbox. Open **“[Simulated] Price Watch: target price reached…”**. Point at “[Simulated]” and at the line with store, old price and new price. Switch back.

**Say**

“Prices don’t drop on cue, so this is demo mode: this button fast-forwards one day. It doesn’t call SearchApi; it simulates what the daily check would save. The stores and today’s prices are real; everything from here is made up, and the banner says so.

“Tomorrow: nothing changed, nothing sent. Day two: [Staples] trims a couple of dollars, and I get a short email about it. Day three: quiet. Day four: [Best Buy] cuts to $104.99, below my target. The card turns green and this email arrives: store, old price, new price. The subject says simulated, because this one is. With real data it’s the same flow; the numbers come from request two, once a day.”

## 9. Read the history (45 seconds, browser)

**Do**
1. Hover the last point of the chart (the tooltip lists every store). Click **Lowest**, then **By seller**.
2. Open **Table view**, point at “simulated” on the rows, close it.

**Say**

“Each line is one store. A gap means the store wasn’t returned that day; it’s never drawn as zero. Lowest can fall just because a cheaper store appeared, which isn’t a price cut, so the highlight compares the same listing between two checks. And a store disappearing from one result isn’t proof it’s out of stock.”

## 10. Build your own (1 minute 15 seconds, editor)

**Do**
1. Show `examples/requests.sh` (the two requests). Then `store.mjs` (where the two engines are called), `scheduler.mjs`, `alerts.mjs`. Keys and tokens off screen.

**Say**

“If you want to build your own, start here: this file is the two requests you saw in the terminal, ready to run. The tool is the same thing in JavaScript. `store.mjs` calls Shopping, then Product, normalizes the offers and saves each observation. `scheduler.mjs` repeats it on the interval. `alerts.mjs` compares two observations and writes the email. SearchApi gives you the records; everything else is your rules. Prices are kept in cents, each market in its own currency, and the product token stays on the server.”

## 11. Closing (30 seconds, camera)

**If the repository is ready:**

“Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The repository in the description has those two requests and the tool, including the demo mode. Clone it, add your SearchApi key, run npm start. A new account comes with 100 free requests. Start with one product you know well, and let the data come to you.”

**If it is not ready yet:**

“Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The docs for both are in the description. The tool you saw runs locally and its repository is still being prepared, so there’s no link yet. Start with the API, save what it returns with a date, and the rest follows.”

## If something differs on the day

- **No “for Business” in the first five (scene 1):** say “it’s further down”; the scene 2 command finds it by title anyway. If it is gone entirely, change `"for Business"` to `"Wireless Mouse"` in the scene 2 command and use that product in the app.
- **A curl returns an error:** read the message aloud (key, rate limit) and move on; the app runs the same requests in scene 4.
- **Prices moved:** set the target about 5% below the lowest you see. The fourth simulated day lands just under it.
- **The app shows different stores than the terminal:** normal; each call is a fresh answer. Don’t compare the two lists on camera.
- **Test email does not arrive within a minute:** keep going; the simulated alerts go to the same address, so show them in scene 8.
- **A click fails in the app:** the message at the top says why. Reload and continue; nothing is lost.

## Do not say

- That the simulated drop happened. The stores are real, so a made-up price presented as real would be a false claim about them. Keep the banner on screen and say “simulated”.
- Any price, store or count that is not on your screen.
- That the lowest price is the best price anywhere. It is the lowest of the offers retrieved, before shipping and tax.
- That a store is out of stock because it disappeared from one result.
- A repository link, a release date or the free allowance, unless you checked them that day.

Captions come from the final audio, not from this script. Chapter times are set after the edit.

## Revision notes (October 6, after Sam’s review)

- **API first.** Scenes 1 and 2 run the two SearchApi requests live in a terminal (curl + jq), with the JSON on screen, before the tool appears. Scene 3 says what you can do with that data (compare, monitor, alert), tool-agnostic.
- **The tool is “one way to do it”.** Its scenes are shorter; scene 10 starts from `examples/requests.sh` (the same two requests) before the tool’s code.
- **Opening and closing** lead with the two requests, not the app.
- **Robust to live data.** Store names and counts are placeholders, the “skip a listing” beat has two versions, and the target adapts to the lowest price on the day.
- Unchanged: the disclosed simulation, the product (Logitech MX Master 3S for Business), and the one-take setup.
