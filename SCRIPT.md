# How to Track Competitor Prices with SearchApi

Price Watch demo script · revised October 6, 2026 after Sam’s review · one continuous take · about 13 minutes

Camera records you to the SD card; OBS records the screen. Everything happens live, in order. **Do** is what you click or type. **Say** is suggested text: read it or say it in your own words. Values in [brackets] are what you see on the day. All in English.

**Angle (from Sam’s review):** the API first, then what you can do with it, then the tool as one way to do it. Someone who never opens Price Watch should still leave knowing how to get every store’s price for a product with two requests.

## Setup (before pressing record)

1. `.env` has `SEARCHAPI_API_KEY`, `RESEND_API_KEY` and `ALERT_EMAIL_TO`.
2. Open Postman with SearchApi’s official collection (fork it from https://www.postman.com/searchapiofficial/searchapi-official-postman-collection into your workspace). Put your key in a collection variable `api_key` of type **secret**, so it shows as dots on screen. Open two request tabs: **Google Shopping** with `q` = `Logitech MX Master 3S graphite`, `gl` = `us`, `hl` = `en`; and **Google Product** with `gl` = `us`, `hl` = `en` and `product_token` empty until scene 2. Response view on **Pretty / JSON**. Rehearse once before recording: send Shopping, copy a `product_token`, send Product. Each send uses one request on your account.
3. Open the docs for Google Shopping and Google Product in two more tabs.
4. Terminal, off camera, before recording: `npm run demo:fresh`. Then open http://127.0.0.1:5194/ (empty watchlist, small **Demo** tag in the header) and your inbox. Close the terminal window and everything else.
5. Editor open on `examples/requests.sh`, `store.mjs`, `scheduler.mjs`, `alerts.mjs` and `.env.example`. Never the real `.env`. The editor is only shown in scene 10.
6. Rehearsed already? `npm run demo:fresh` again before the real take.

Expected on the day (checked October 6): the Shopping request returns about 40 results; the “for Business” entry shows Best Buy $109.99; the Product request returns **Best Buy, Target, CDW at $109.99 and Staples at $119.99**, each with delivery and a store link. In the app, the same product also shows a fifth listing, **Lenovo “Brown Box” $109.99**. Prices move; use what you see. The only number to adapt is the target, a little below the lowest price.

## 0. Opening (45 seconds, on camera)

**Do:** Camera only. Screen shows Postman on the Google Shopping request, not yet sent.

**Say**

“Every store that sells a product is listed on Google Shopping, with its price, right now. If you sell that product, or you’re shopping for it, that list is the answer to ‘where do I stand?’. The problem is that it lives inside a web page.

“I’m Gabs, developer advocate at SearchApi. SearchApi turns Google results into structured data, and today I want to show you two of its APIs: Google Shopping and Google Product. With two requests you get every store’s offer for a product as JSON. Then I’ll show what you can do with that: compare, monitor, get alerted. And I’ll show the small tool I built on top of it, in case you’d rather use one than write one.

“Let’s start with the data.”

## 1. Request one: find the product (1 minute 30 seconds)

**Do**
1. In Postman, on the **Google Shopping** request, point at the URL and the **Params** tab: `engine`, `q`, `gl`, `hl`, and `api_key` as a masked variable. Click **Send**.
2. In the response, point at the status and time, then scroll to `shopping_results`.
3. Use the response search (⌘F) for “for Business”. Point at `title`, `price`, `seller`, `product_token`. Select the token value and copy it.
4. Switch to the Google Shopping docs tab for five seconds and point at the parameters list. Back to Postman.

**Say**

“This is SearchApi’s Postman collection, and this is a Google Shopping search: one GET request with the engine, my query, the country and my key. I’m asking for the Logitech MX Master 3S, graphite, in the US. Send.

“What comes back is the Google Shopping results page as JSON: about forty products, each with a title, the headline price, the seller Google shows on the card, and this `product_token`. The price here is just a headline; some entries don’t even have one. The token is what matters: it identifies the product so I can ask for its offers. I’ll copy it.

“The docs list every parameter: language, device, pagination, sorting, filters. Pick a specific model; a category query gives you a mix.”

## 2. Request two: every store’s offer (1 minute 30 seconds)

**Do**
1. Switch to the **Google Product** request tab. Paste the token into `product_token`. Point at `engine`. Click **Send**.
2. In the response, scroll to `offers`. Read the four entries: `merchant.name`, `price`, `total_price`, `delivery_price`, `link`.
3. Scroll up to `typical_prices` and `product`. Point at them.
4. Switch to the Google Product docs tab for five seconds. Back.

**Say**

“Second request: Google Product, with the token from the entry I chose. This one returns the product itself and its offers: four stores, each with the item price, the total with delivery, the delivery promise and a link to the store page. It also returns Google’s typical price range, the specifications and the reviews, if you want them.

“That’s the whole pattern. Shopping to find the product and get a token, Product to get the offers. Two requests, and you have what a human would get from opening ten tabs. Save the result with a date, run it again tomorrow, and you have a price history. Everything from here is built on exactly these two calls.”

## 3. What you can do with it (45 seconds, on camera or over the Postman response)

**Say**

“So what do people do with this? Three things, mostly.

“Compare: if you sell this product, you see where your price sits next to every store, in one call.

“Monitor: run the two requests on a schedule and keep each answer. Now you see who moved, when, and by how much.

“Alert: compare today’s offers with yesterday’s and send a message when a confirmed store changes its price, or when the lowest one reaches a number you care about.

“You can write that in an afternoon in any language. I wrote one in plain JavaScript, no dependencies, and I’ll use it to show the three things. If you’d rather build your own, the script with these two requests is in the repository.”

## 4. The tool: find and confirm (1 minute 45 seconds)

**Do**
1. Switch to the app tab (port 5194). Type `Logitech MX Master 3S graphite` in **Product name or model**. Click **Search · 1 request**.
2. Point at the cards: “the same results you just saw as JSON in Postman”. Click **Inspect offers · 1 request** on **“Logitech MX Master 3S for Business Mouse”**.
3. In the offers table, point at the five stores. Point at the **Lenovo** line, “Brown Box”.
4. Tick **Target, Best Buy, CDW and Staples**. Leave **Lenovo** unticked.

**Say**

“This is Price Watch. Search is request one, the same results, now as cards. Inspect is request two, the offers for the card I chose.

“Here the app does something the API can’t do for you: five stores came back, and four are the same thing, the MX Master 3S for Business, graphite, new, retail box. This one from Lenovo is a brown box: bulk packaging, different part number. Same mouse, not the same product on sale. If I compare it, my lowest price is wrong. So I leave it out.

“The app already drops used items, unavailable listings and prices it can’t parse. The rest is my call, and it’s the step every price tool should make you take: a lower price only matters if it’s the same product.”

## 5. Save the baseline and set a target (45 seconds)

**Do**
1. In **Variant you confirmed**, type `for Business · graphite · new · retail box`. In **Target price (USD)**, type `105`. Click **Add to watchlist**.
2. On the product page, point at **Lowest confirmed offer $109.99** and **Target price $105.00**.

**Say**

“I describe the variant in my own words and set a target: a hundred and five dollars, the price I want to be told about. Saved. This is the baseline: four confirmed stores, lowest at $109.99, observed today. One observation, so no history yet.”

## 6. Monitor: schedule and cost (1 minute)

**Do**
1. Click **Settings**. In **Automatic checks**, open **How often**: point at **Every hour**, **Every day**, **Every week**. Leave **Every day**.
2. Point at **SearchApi usage**: searches left, “about 2 requests a day”.

**Say**

“Monitoring is the two requests on a timer. I choose how often here. Each check is up to two searches per product, so one product once a day is about two a day; five products are about ten. A new SearchApi account comes with 100 free requests, so that’s about ten days of daily checks before you decide whether it’s worth a plan. The page reads my real balance from SearchApi’s account endpoint; if it runs out, checks pause and the history stays.”

## 7. Alert: email (1 minute 15 seconds)

**Do**
1. In **Settings → Email alerts**, point at the masked address. Switch to the editor, show `.env.example` (the three email lines), switch back.
2. Click **Send a test**. Switch to the inbox, open the test email, switch back.

**Say**

“Alerts go by email through Resend: a free plan and one HTTPS call, nothing to install. Two settings: the Resend key and the address. Resend’s default sender only delivers to the email of your own Resend account; to send elsewhere, verify a domain and set the sender in the third variable. Test sent, and received.”

## 8. Fast-forward: a price drop (2 minutes)

**Do**
1. Click the **Logitech** in the watchlist. Point at **Simulate next day** and at the **Demo** tag.
2. Click **Simulate next day**: “No price changed.” Point at the yellow banner and the date, [October 7].
3. Click again: “[Staples] lowered its price slightly.” Point at the highlight under the chart.
4. Click again: “No price changed.”
5. Click a fourth time: “[Best Buy] cut its price.” Point at **$104.99** and the green **Target reached** card.
6. Switch to the inbox. Open **“[Simulated] Price Watch: target price reached…”**. Point at “[Simulated]” and the three lines: store, old price, new price. Switch back.

**Say**

“Prices don’t drop on cue, so this is demo mode: the button fast-forwards one day. It doesn’t call SearchApi; it simulates what the daily check would save. The stores and today’s prices are real; everything from here is made up, and the banner says so.

“Tomorrow: nothing changed, nothing sent. Day two: [Staples] trims a couple of dollars, I get a short email. Day three: quiet. Day four: [Best Buy] cuts to $104.99, below my $105 target. The card turns green and this email arrives: store, old price, new price. The subject says simulated, because this one is. With real data it’s the same flow; the numbers come from request two, once a day.”

## 9. Read the history (45 seconds)

**Do**
1. Hover the last point of the chart (all four stores in the tooltip). Click **Lowest**, then **By seller**. Open **Table view**, point at “simulated”, close it.

**Say**

“Each line is one store. A gap means the store wasn’t returned that day; it’s never drawn as zero. Lowest can fall just because a cheaper store appeared, which isn’t a price cut, so the highlight compares the same listing between two checks. And a store disappearing from one result isn’t proof it’s out of stock.”

## 10. Build your own (1 minute 15 seconds)

**Do**
1. Switch to the editor. Show `examples/requests.sh` (the two curls). Then `store.mjs` where the two engines are called, `scheduler.mjs`, `alerts.mjs`. Keys and tokens off screen.

**Say**

“If you want to build your own, start here: this file is the two requests you saw in Postman, as curl, ready to run. The tool is the same thing in JavaScript: `store.mjs` calls Shopping and then Product, normalizes the offers and saves each observation; `scheduler.mjs` repeats it on the interval; `alerts.mjs` compares two observations and writes the email. SearchApi gives you the records; everything else is your rules. Prices are kept in cents, each market in its own currency, and the product token stays on the server.”

## 11. Closing (30 seconds, on camera)

**If the repository is ready:**

“Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The repository in the description has the curl examples and the tool, including the demo mode. Clone it, add your SearchApi key, run npm start. A new account comes with 100 free requests. Start with one product you know well, and let the data come to you.”

**If it is not ready yet:**

“Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The docs for both are in the description. The tool you saw is running locally and the repository is still being prepared, so there’s no link yet. Start with the API, save what it returns with a date, and the rest follows.”

## If something differs on the day

- **The “for Business” entry is hard to find in the response:** Postman’s response search (⌘F) for “for Business”. If it is gone, use **“Logitech MX Master 3S Wireless Mouse”** in both Postman and the app, and adapt the store names.
- **Prices moved:** set the target about 5% below the lowest. The fourth simulated day lands just under it.
- **A Postman send fails:** read the status aloud, switch to the docs tab (each doc has a full example response) and continue; the app runs the same requests in scene 4.
- **Test email does not arrive within a minute:** keep going; the simulated alerts go to the same address, so show them in scene 8.
- **A click fails in the app:** the message at the top says why. Reload and continue; nothing is lost.

## Do not say

- That the simulated drop happened. The stores are real, so a made-up price presented as real would be a false claim about them. Keep the banner on screen and say “simulated”.
- Any price, store or change that is not on your screen.
- That the lowest price is the best price anywhere. It is the lowest of the offers retrieved, before shipping and tax.
- That a store is out of stock because it disappeared from one result.
- A repository link, a release date or the free allowance, unless you checked them that day.

Captions come from the final audio, not from this script. Chapter times are set after the edit.

## Revision notes (October 6, after Sam’s review)

- **API first.** New scenes 1 and 2 send the two SearchApi requests live from SearchApi’s official Postman collection (no terminal), with the JSON on screen, before the tool appears. New scene 3 says what you can do with that data (compare, monitor, alert) in a tool-agnostic way.
- **The tool is now “one way to do it”.** Old scenes 1 to 3 became scenes 4 and 5 and were shortened; Settings and email (scenes 6 and 7) were trimmed; the history scene was cut to 45 seconds.
- **Build your own.** `examples/requests.sh` was added to the repository with the two curls, and scene 10 points to it before showing the tool’s code.
- **Opening and closing** now lead with the two requests, not the app.
- Unchanged: the disclosed simulation (scene 8), the product (Logitech MX Master 3S for Business, four stores, Lenovo skipped), the target ($105 → $104.99), and the one-take setup.
