# How to Track Competitor Prices with SearchApi

Price Watch demo script · revised October 6, 2026 · one continuous take · about 13 minutes

**How to read this:** everything runs in the exact order written. *Lines in italics are actions* (what you click, type or point at). Plain text is what you say, word for word or in your own words. Values in [brackets] are what you see on the day. All in English.

**Angle (from Sam’s review):** the API first, then what you can do with it, then the tool as one way to do it.

**Screens, in order:** camera → terminal (scenes 1–2) → camera (3) → browser, the app (4–9) → editor (10) → camera (11).

## Setup (before pressing record)

- `.env` in the Price Watch folder has `SEARCHAPI_API_KEY`, `RESEND_API_KEY` and `ALERT_EMAIL_TO`.
- **Terminal A, off camera.** Run this, leave it running and minimize it. It starts a clean demo workspace on http://127.0.0.1:5194/: searches and saves are real, only the daily checks are simulated.

```
cd ~/GabsOS/searchapi/price-watch && npm run demo:fresh
```

- **Terminal B, the one on camera.** Large font, dark theme. Run this, then nothing else until scene 1. The key goes into the environment and never appears on screen.

```
mkdir -p ~/pw-demo && cd ~/pw-demo && export $(grep SEARCHAPI_API_KEY ~/GabsOS/searchapi/price-watch/.env | xargs) && clear
```

- **Browser:** the app at http://127.0.0.1:5194/ (empty watchlist, small **Demo** tag in the header), the SearchApi docs for Google Shopping, and your inbox. Close everything else.
- **Editor:** `examples/requests.sh`, `store.mjs`, `scheduler.mjs`, `alerts.mjs`. Never the real `.env`.
- **Rehearsed already?** Run `npm run demo:fresh` again in terminal A and `clear` in terminal B before the real take. Scenes 1–2 use 2 SearchApi requests; scene 4 uses 2 more.

**What to expect** (checked October 6). Results change from call to call, even minutes apart, so never promise names or counts that are not on screen:

- Scene 1 returns about 40 results. “Logitech MX Master 3S for Business Mouse” was among the first five both times, at $109.99.
- Scene 2 returned 3 or 4 stores (Target, Best Buy, Staples, sometimes CDW), $109.99 to $119.99, and a typical range of $90–$120.
- In the app, the same product once showed a fifth listing, Lenovo “Brown Box”. It may or may not appear.
- The one number to adapt is the target: about 5% below the lowest price you see. With $109.99, use $105.

## 0. Opening (45 seconds)

*Camera on you. The screen is not shown yet.*

Every store that sells a product is listed on Google Shopping, with its price, right now. If you sell that product, or you’re shopping for it, that list is the answer to “where do I stand?”. The problem is that it lives inside a web page.

I’m Gabs, developer advocate at SearchApi. SearchApi turns Google results into structured data, and today I want to show you two of its APIs: Google Shopping and Google Product. With two requests you get every store’s offer for a product, as JSON. Then I’ll show what you can do with that: compare, monitor, get alerted. And I’ll show the small tool I built on top of it, in case you’d rather use one than write one.

Let’s start with the data.

## 1. Request one: find the product (1 minute 30 seconds)

*Cut to terminal B. Paste this command, but don’t press Enter yet.*

```
curl -s -G https://www.searchapi.io/api/v1/search \
  -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
  --data-urlencode engine=google_shopping \
  --data-urlencode "q=Logitech MX Master 3S graphite" \
  --data-urlencode gl=us > shopping.json
```

This is a Google Shopping search through SearchApi. It’s one GET request: the engine *(point at `engine=google_shopping`)*, my query *(point at `q`)*, and the country *(point at `gl`)*, with my API key in the header. I’m asking for the Logitech MX Master 3S, graphite, in the US, and I’m saving the answer to a file.

*Press Enter. It returns in about a second, with no output.*

Now let’s look at what came back.

*Paste and run:*

```
jq '.shopping_results[:5] | map({title, price, seller, product_token: (.product_token[:12] + "…")})' shopping.json
```

This is the Google Shopping results page as JSON. There are about forty products; I’m showing the first five. Each one has a title, the headline price, the seller Google shows on the card, and this product token.

*Point at the price of one entry.*

The price here is just a headline. Some entries don’t even have one.

*Point at the product token of the “for Business” entry.*

The token is what matters: it identifies the product, so I can ask for its offers. I want this one, the MX Master 3S for Business.

*Switch to the Google Shopping docs tab for five seconds, scroll the parameters list, then come back to the terminal.*

The docs list every parameter: language, device, pagination, sorting, price filters. My tip: search for a specific model. A category query gives you a mix.

## 2. Request two: every store’s offer (1 minute 30 seconds)

*Paste this command, but don’t press Enter yet.*

```
TOKEN=$(jq -r '[.shopping_results[] | select(.title | test("for Business"))][0].product_token' shopping.json)
curl -s -G https://www.searchapi.io/api/v1/search \
  -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
  --data-urlencode engine=google_product \
  --data-urlencode "product_token=$TOKEN" \
  --data-urlencode gl=us \
  | jq '{product: .product.title, typical: {low: .typical_prices.low_price, high: .typical_prices.high_price, popular: .typical_prices.popular_choice}, offers: [.offers[] | {seller: .merchant.name, price, total_price, delivery: .delivery_price}]}'
```

The second request is Google Product. *(Point at the first line.)* This first line just takes the token of the “for Business” entry from the file I saved. *(Point at `engine=google_product` and `product_token`.)* Then I call Google Product with that token.

*Press Enter. Wait for the output.*

*Point at the offers, one store at a time.*

This returns the product and its offers. [Three] stores, each with the item price, the total with delivery, and the delivery promise. There’s also a link to each store’s page; I left it out to keep this readable.

*Point at the typical block.*

It also returns Google’s typical price range for this product, [$90 to $120], and which store is the popular choice. And there’s more in the response: specifications and reviews.

That’s the whole pattern. Shopping to find the product and get a token, Product to get the offers. Two requests, and you have what a human gets from opening ten tabs. Save the result with a date, run it again tomorrow, and you have a price history. Everything from here is built on exactly these two calls.

## 3. What you can do with it (45 seconds)

*Cut to camera.*

So what do people do with this? Three things, mostly.

Compare: if you sell this product, you see where your price sits next to every store, in one call.

Monitor: run the two requests on a schedule and keep each answer. Now you see who moved, when, and by how much.

Alert: compare today’s offers with yesterday’s, and send a message when a store changes its price, or when the lowest one reaches a number you care about.

You can write that in an afternoon, in any language. I wrote one in plain JavaScript, with no dependencies, and I’ll use it to show you all three. If you’d rather build your own, the two requests you just saw are in the repository, ready to run.

## 4. The tool: find and confirm (1 minute 45 seconds)

*Cut to the browser, on the app. Click the “Product name or model” field and type `Logitech MX Master 3S graphite`. Click **Search · 1 request**.*

This is Price Watch. Search is request one, now shown as cards.

*Find “Logitech MX Master 3S for Business Mouse” among the cards (⌘F if needed) and click its **Inspect offers · 1 request**.*

Inspect is request two: the offers for the product I chose.

*Move the mouse slowly over the stores and prices.*

Now the step the API can’t do for you: deciding which offers are really the same product. I check the model, the color, the condition and the packaging.

*Then use ONE of the two versions below.*

**Version A, if one listing is something else** (in rehearsal it was Lenovo “Brown Box”; it could also be a bundle with a keyboard or a refurbished unit):

*Point at that listing.*

This one from [Lenovo] is a [brown box]. It’s the same mouse, but bulk packaging and a different part number, so it’s not the same thing on sale. If I compare it, my lowest price is wrong.

*Tick all the other listings. Leave that one unticked.*

So I tick the others and leave it out.

**Version B, if they all match:**

*Tick all the listings.*

Here they’re all the same model, so I keep them all. When one isn’t, a bundle or a different box, I leave it out, because a lower price only matters if it’s the same product.

*Both versions continue here.*

The app already drops used items, unavailable listings and prices it can’t parse. The rest is my call.

## 5. Save the baseline and set a target (45 seconds)

*Scroll down. In “Variant you confirmed”, type `for Business · graphite · new · retail box`.*

I describe the variant in my own words, so I remember what I’m following.

*In “Target price (USD)”, type `105`, or about 5% below the lowest price on screen.*

And I set a target: a hundred and five dollars. That’s the price I want to be told about.

*Click **Add to watchlist**. Point at the two cards: “Lowest confirmed offer” and “Target price”.*

Saved. This is the baseline: [four] confirmed stores, the lowest at [$109.99], observed today. It’s one observation, so there’s no history yet.

## 6. Monitor: schedule and cost (1 minute)

*Click **Settings** (top right).*

Monitoring is the same two requests on a timer.

*Open the “How often” list. Point at Every hour, Every day and Every week. Leave it on Every day.*

I choose how often: every hour, every day, every week.

*Point at the SearchApi usage card: the searches left and “about 2 requests a day”.*

Each check uses up to two searches per product. So one product, once a day, is about two searches a day; five products, about ten. A new SearchApi account comes with 100 free requests, so that’s about ten days of daily checks before you decide whether it’s worth a plan. This card reads my real balance from SearchApi’s account endpoint. If it runs out, the checks pause, and the history stays.

## 7. Alert: email (1 minute)

*Still in Settings, point at the Email alerts card and the masked address.*

Alerts go by email, through Resend. It has a free plan, and it’s a single HTTPS call, so there’s nothing to install. It needs two settings: the Resend API key, and the address that receives the alerts.

One thing to know: Resend’s default sender only delivers to the email of your own Resend account. To send anywhere else, you verify a domain in Resend and set the sender in a third setting.

*Click **Send a test**. Switch to the inbox tab and open “Price Watch test email”.*

Test sent, and here it is.

*Switch back to the app.*

## 8. Fast-forward: a price drop (2 minutes)

*Click the Logitech in the watchlist on the left. Point at the **Simulate next day** button and at the Demo tag in the header.*

Prices don’t drop on cue, so this is demo mode. This button fast-forwards one day. It doesn’t call SearchApi; it simulates what the daily check would save. The stores and today’s prices are real. Everything from here on is made up, and the banner will say so.

*Click **Simulate next day**. The message says “No price changed.” Point at the yellow banner and at the new date.*

Tomorrow: nothing changed, so nothing is sent.

*Click again. The message says “[Staples] lowered its price slightly.” Point at the highlight under the chart.*

Day two: [Staples] trims a couple of dollars, and I get a short email about it.

*Click again. “No price changed.”*

Day three: quiet.

*Click a fourth time. The message says “[Best Buy] cut its price.” Point at “Lowest confirmed offer $104.99” and at the green “Target reached” card.*

Day four: [Best Buy] cuts to a hundred and four ninety-nine. That’s below my target, so the card turns green…

*Switch to the inbox. Open “[Simulated] Price Watch: target price reached…”. Point at “[Simulated]” in the subject, then at the line with the store, the old price and the new price.*

…and this email arrives: the store, the old price, the new price. The subject says simulated, because this one is. With real data it’s the same flow; the numbers just come from request two, once a day.

*Switch back to the app.*

## 9. Read the history (45 seconds)

*Hover the last point of the chart, so the tooltip lists every store.*

Each line is one store. If a store isn’t returned one day, its line shows a gap. It’s never drawn as zero.

*Click **Lowest**.*

Lowest is the cheapest confirmed price at each check. That line can fall just because a cheaper store appeared, which isn’t a price cut.

*Click **By seller** again. Point at the highlight under the chart.*

That’s why the highlight compares the same listing between two checks. And a store disappearing from one result isn’t proof it’s out of stock.

*Open **Table view**, point at “simulated” on the rows, and close it.*

## 10. Build your own (1 minute 15 seconds)

*Switch to the editor, on `examples/requests.sh`.*

If you want to build your own, start here. This file is the two requests you saw in the terminal, ready to run.

*Open `store.mjs` and scroll to where the two engines are called.*

The tool is the same thing in JavaScript. This file calls Shopping, then Product, normalizes the offers and saves each observation.

*Open `scheduler.mjs`, then `alerts.mjs`. Keep keys and tokens off screen.*

This one repeats it on the interval, and this one compares two observations and writes the email. SearchApi gives you the records; everything else is your own rules. Prices are kept in cents, each market in its own currency, and the product token stays on the server.

## 11. Closing (30 seconds)

*Cut to camera. Use ONE of the two versions.*

**If the repository is ready:**

Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The repository in the description has those two requests and the tool, including the demo mode. Clone it, add your SearchApi key, and run npm start. A new account comes with 100 free requests. Start with one product you know well, and let the data come to you.

**If it is not ready yet:**

Two requests: Google Shopping to find the product, Google Product to get every store’s offer. The docs for both are in the description. The tool you saw runs locally, and its repository is still being prepared, so there’s no link yet. Start with the API, save what it returns with a date, and the rest follows.

## If something differs on the day

- **No “for Business” in the first five (scene 1):** say “it’s further down”. The scene 2 command finds it by title anyway. If it’s gone entirely, change `for Business` to `Wireless Mouse` in the scene 2 command and use that product in the app too.
- **A curl returns an error:** read the message aloud (key, rate limit) and move on. The app runs the same requests in scene 4.
- **Prices moved:** set the target about 5% below the lowest you see. The fourth simulated day lands just under it.
- **The app shows different stores than the terminal:** that’s normal, each call is a fresh answer. Don’t compare the two lists on camera.
- **The test email doesn’t arrive within a minute:** keep going. The simulated alerts go to the same address, so show them in scene 8.
- **A click fails in the app:** the message at the top of the page says why. Reload and continue; nothing is lost.

## Do not say

- That the simulated drop happened. The stores are real, so a made-up price presented as real would be a false claim about them. Keep the banner on screen and say “simulated”.
- Any price, store or count that isn’t on your screen.
- That the lowest price is the best price anywhere. It’s the lowest of the offers retrieved, before shipping and tax.
- That a store is out of stock because it disappeared from one result.
- A repository link, a release date or the free allowance, unless you checked them that day.

Captions come from the final audio, not from this script. Chapter times are set after the edit.

## Revision notes (October 6, after Sam’s review)

- **API first.** Scenes 1 and 2 run the two SearchApi requests live in a terminal (curl + jq), with the JSON on screen, before the tool appears. Scene 3 says what you can do with that data (compare, monitor, alert), tool-agnostic.
- **The tool is “one way to do it”.** Its scenes are shorter; scene 10 starts from `examples/requests.sh` (the same two requests) before the tool’s code.
- **Opening and closing** lead with the two requests, not the app.
- **Robust to live data.** Store names and counts are placeholders, the “skip a listing” beat has two versions, and the target adapts to the lowest price on the day.
- **Format.** Actions and speech are interleaved in the exact order of the take; actions are in italics.
