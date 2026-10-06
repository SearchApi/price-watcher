# How to Track Competitor Prices with SearchApi

Price Watch demo script · October 6, 2026 · one continuous take · about 12 minutes

Camera records you to the SD card; OBS records the screen. Everything happens live, in order, in **one browser tab**. **Do** is what you click. **Say** is suggested text: read it or say it in your own words. Values in [brackets] are what you see on the day. All in English.

## Setup (before pressing record)

1. `.env` has `SEARCHAPI_API_KEY`, `RESEND_API_KEY` and `ALERT_EMAIL_TO`. Nothing else is needed.
2. In the terminal: `cd ~/GabsOS/searchapi/price-watch && npm run demo:fresh`. This starts a clean demo workspace (no products) on **http://127.0.0.1:5194/**. Searches and saves are real; only the daily checks will be simulated.
3. Open http://127.0.0.1:5194/ in one tab and your inbox in another. Close everything else. The small **Demo** tag in the header is expected.
4. Have `.env.example` open in your editor (never the real `.env`), and the four files for the code scene: `model.mjs`, `store.mjs`, `scheduler.mjs`, `alerts.mjs`.
5. Rehearsed already? Run `npm run demo:fresh` again before the real take, so the watchlist is empty.

Expected on the day (checked October 6, 9:00 AM): searching `Logitech MX Master 3S graphite` returns the card **“Logitech MX Master 3S for Business Mouse”** (second card). Inspecting it returns five offers: **Best Buy, Target, CDW at $109.99, Staples at $119.99, and Lenovo “Brown Box” at $109.99**. Prices can move. If they did, use what you see; the only number to adapt is the target, which must stay a little below the lowest price (within about 10%).

## 0. Opening (45 seconds, on camera)

**Do:** Camera only. Screen shows the empty **Find a product** page.

**Say**

“If you sell anything online, you’ve probably done this: open ten tabs, check what every store charges for your product, write it down, and do it all again next week. Today I’m replacing that with a small app that does it for me, every day, and emails me when something changes.

“I’m Gabs, developer advocate at SearchApi. SearchApi gives you Google results as structured data: Search, Shopping, Maps and a few more. For this one I’m using two of them: Google Shopping to find the product, and Google Product to get the offers from every store.

“By the end of this video you’ll know how to find the exact product and its offers through the API, how to make sure you’re comparing the same thing, and how to run that check on a schedule and get an email when a price moves. The code is small and runs on your machine. Let’s build the watchlist from zero.”

## 1. Find the product (1 minute)

**Do**
1. Click the **Product name or model** field. Type `Logitech MX Master 3S graphite`. Leave **United States**.
2. Click **Search · 1 request**.
3. Move the mouse over the first two cards. Click **Inspect offers · 1 request** on **“Logitech MX Master 3S for Business Mouse”**.

**Say**

“I search for an exact model, not a category. One request to SearchApi’s Google Shopping API, and I get back thirty product cards, each with a product token.

“The price on a card is just Google’s headline. Some cards don’t even show one. What I want is the list of stores behind a product, so I pick this card and inspect it. That’s the second request: Google Product, with the token from this card, and it returns the offers from every store.”

## 2. Confirm it is the same product (1 minute 30 seconds)

**Do**
1. Scroll the offers table slowly. Point at the five store names and prices.
2. Point at the **Lenovo** line and its title, “Brown Box”.
3. Tick **Target, Best Buy, CDW and Staples**. Leave **Lenovo** unticked.

**Say**

“Five stores. Four of them are the same thing: the MX Master 3S for Business, graphite, new, in a retail box. Two of them even show the same part number.

“This one from Lenovo is the same mouse, but it’s a brown box: bulk packaging, no retail box, and a different part number. If I let it in, I’m comparing two different things. So I leave it out.

“Price Watch already removes used products, unavailable listings and prices it can’t read. This part is my call, and it’s the part most price tools skip. A lower price only matters if it’s the same product.”

## 3. Save the baseline and set a target (1 minute)

**Do**
1. Scroll down. In **Variant you confirmed**, type `for Business · graphite · new · retail box`.
2. In **Target price (USD)**, type `105`.
3. Click **Add to watchlist**.
4. On the product page, point at the two cards: **Lowest confirmed offer $109.99** and **Target price $105.00**. Then point at the offers table and the **Save selection** button.

**Say**

“I describe the variant in my own words, so I remember what I’m following. And I set a target: a hundred and five dollars. That’s the price at which I want to be told.

“Saved. This is my baseline: four confirmed stores, the lowest at $109.99, observed today. It’s one observation, so there is no history yet, and the app says so. It’s stored on this computer; reopening the page doesn’t search again.”

## 4. Automatic checks and what they cost (1 minute 15 seconds)

**Do**
1. Click **Settings** (top right).
2. In **Automatic checks**, open **How often**. Point at **Every hour**, **Every day**, **Every week**. Leave it on **Every day**.
3. Point at **SearchApi usage**: searches left, and “about 2 requests a day”.

**Say**

“To monitor competitor prices automatically with SearchApi, you repeat the same two requests on a schedule: search Google Shopping again, then get the offers. Price Watch does that for every product while it’s running, and I choose how often here: every hour, every day, every week.

“Each check uses up to two searches per product. One product, once a day, is about two requests a day. Five products checked daily use about ten, so the free 100 requests on a new SearchApi account last about ten days. This page reads my real balance from SearchApi. If it runs out, the checks pause and the app tells me. My history stays.”

## 5. Email alerts (1 minute 30 seconds)

**Do**
1. Still in **Settings**, point at **Email alerts** and the masked address.
2. Switch to the editor and show `.env.example`: `RESEND_API_KEY`, `ALERT_EMAIL_TO`, `ALERT_EMAIL_FROM`. Switch back.
3. Click **Send a test**. Wait for “Test email sent”.
4. Switch to the inbox tab. Open **“Price Watch test email”**. Switch back.

**Say**

“Alerts go by email, through Resend. It has a free plan, and it’s a plain HTTPS call, so there’s nothing to install. Two settings: my Resend API key, and the address that receives the alerts. Until both are there, email stays off.

“One thing to know: Resend’s default sender, onboarding at resend dot dev, only delivers to the email of your own Resend account. That’s fine for a personal monitor. To send anywhere else, verify a domain in Resend and put a sender from that domain in the third variable.

“Let me send a test. And here it is.”

## 6. Fast-forward: a price drop (2 minutes)

**Do**
1. Click the **Logitech** in the watchlist on the left.
2. Point at **Simulate next day** and at the **Demo** tag in the header.
3. Click **Simulate next day**. Read the message: “No price changed.” Point at the yellow banner that appeared and at the date, [October 7].
4. Click again. Message: “[Staples] lowered its price slightly.” Point at the change highlight under the chart.
5. Click again. “No price changed.”
6. Click a fourth time. Message: “[Best Buy] cut its price.” Point at **Lowest confirmed offer $104.99** and at the green **Target reached** card.
7. Switch to the inbox. Open the email **“[Simulated] Price Watch: target price reached for Logitech…”**. Point at “[Simulated]” in the subject and at the three lines: store, old price, new price. Switch back.

**Say**

“Now, prices don’t drop on cue, and I’m not going to make you wait a week. So this is Price Watch in demo mode, and this button fast-forwards one day. It doesn’t call SearchApi; it simulates what the daily check would save. The stores are real and today’s prices are real. Everything from here is made up, and the banner says so.

“Tomorrow: nothing changed, so nothing is sent. Day two: [Staples] trims a couple of dollars, and I get a short email about that. Day three: quiet.

“Day four: [Best Buy] cuts to $104.99. That’s below my target of $105, so the card turns green and this email arrives: target reached, with the store, the old price and the new one. The subject says simulated, because this one is.

“With real data this works exactly the same way. The only difference is where the numbers come from.”

## 7. Read the history (1 minute)

**Do**
1. On the chart, hover the last point so the tooltip shows all four stores. Then hover the first point.
2. Click **Lowest**, then back to **By seller**.
3. Open **Table view**. Point at “simulated” on the rows. Close it.

**Say**

“Each line is one store, and the color stays with the store. If a store isn’t returned one day, its line shows a gap. It’s never drawn as zero.

“Lowest is the cheapest confirmed price at each check. That line can fall just because a cheaper store showed up, which isn’t the same as a store cutting its price. The highlight below the chart compares the same listing between two checks, so it only shows real moves. And when a store disappears from a result, that’s not proof it’s out of stock.”

## 8. How it is built (1 minute 30 seconds)

**Do**
1. Switch to the editor. Show `model.mjs` (normalization), `store.mjs` (the two requests and saved observations), `scheduler.mjs`, `alerts.mjs`. Keep keys and tokens off screen.
2. Show the two request shapes below (keep them in a scratch file).

```json
{ "engine": "google_shopping", "q": "Logitech MX Master 3S graphite", "gl": "us", "hl": "en", "link": "resolved" }
```

```json
{ "engine": "google_product", "product_token": "TOKEN_FROM_THE_SELECTED_RESULT", "gl": "us", "hl": "en" }
```

**Say**

“SearchApi gives us the product records and the store offers. Our app adds the confirmed match, the saved history, the schedule, the target and the email. The product token stays on the server, and every check gets a fresh one with another Shopping search. Prices are calculated in cents, each market in its own currency.

“The usage numbers come from SearchApi’s account endpoint. It returns the searches left and the hourly limit, and the app uses that limit to cap its own requests.”

## 9. Closing (30 seconds, on camera)

**If the repository is ready:**

“The repository in the description has everything you just saw, including the demo mode. Clone it, add your own SearchApi key and run npm start. Nothing else to install. A new SearchApi account includes 100 free requests, and the app shows how many you have left. Start with one product you know well, tick the right listings and let the app come back for the next check.”

**If it is not ready yet:**

“That’s the workflow: search Google Shopping with SearchApi, confirm the exact product, get its offers and keep a dated history. The schedule, the target and the email alerts are running in this local version. The repository is still being prepared, so there’s no download link yet. Start with the Google Shopping and Google Product documentation, and keep the date, market and variant attached to every price you save.”

## If something differs on the day

- **The “for Business” card is not second:** find it among the thirty; if it is gone, inspect **“Logitech MX Master 3S Wireless Mouse”** instead and adapt the store names.
- **Prices moved:** set the target about 5% below the lowest price you see. The fourth simulated day lands just under it.
- **Only one or two eligible stores:** the simulation still works; say “stores” less and show the chart with fewer lines.
- **Test email does not arrive within a minute:** keep going; the simulated alerts go to the same address, so show them in scene 6 instead.
- **A click fails:** the message at the top of the page says why. Reload and continue; nothing is lost.

## Do not say

- That the simulated drop happened. The stores are real, so a made-up price presented as real would be a false claim about them. Keep the banner on screen and say “simulated”.
- Any price, store or change that is not on your screen.
- That the lowest price is the best price anywhere. It is the lowest of the offers retrieved, before shipping and tax.
- That a store is out of stock because it disappeared from one result.
- A repository link, a release date or the free allowance, unless you checked them that day.

Captions come from the final audio, not from this script. Chapter times are set after the edit.
