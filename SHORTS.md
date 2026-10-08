# Price Watch · Shorts

Two vertical shorts (9:16, under 60 seconds) based on the long video “How to Track Competitor Prices with SearchApi”. October 8, 2026.

**How to read this:** same as the main script. *Lines in italics are actions or on-screen text.* Plain text is what you say. Values in [brackets] are what you see on the day. All in English.

**Recording:** you can reuse the screen footage from the long take (OBS) and record only the voice and the camera shots again in vertical. Crop the screen to the area that matters and zoom so text is readable on a phone. Captions burned in.

## Short 1 · Every store’s price in two API calls (about 45 seconds)

**Angle:** pure API. No app. The viewer leaves knowing the two requests.

*0–3s. Terminal full screen, already showing the offers JSON from request two. On-screen text: “Every store. Every price. 2 API calls.”*

This is every store selling this mouse, and what each one charges. Two API calls.

*3–15s. Cut to request one being pasted (footage from scene 1). Highlight `engine=google_shopping` and `q` as you name them.*

Call one: SearchApi’s Google Shopping API. Engine, the product, the country.

*Show the JSON. Highlight one `product_token`. On-screen text: “product_token = the key”.*

You get the results page as JSON, and every product comes with a token. That token is the key.

*15–30s. Cut to request two (footage from scene 2). Highlight `engine=google_product` and `product_token`.*

Call two: Google Product, with that token.

*Show the offers. Highlight each store and price, one by one.*

Back come the offers: [Target, Best Buy, Staples], each with its price, the total with delivery, and a link.

*30–40s. On-screen text: “Run it daily → price history”.*

Run those two calls every day, save the answer with a date, and you’ve got a price tracker.

*40–45s. Camera, vertical. On-screen text: “SearchApi · 100 free requests”.*

New SearchApi accounts get a hundred free requests. Full build is on the channel.

*Spoken words: about 105, roughly 45 seconds.*

## Short 2 · An email when a competitor drops their price (about 55 seconds)

**Angle:** the payoff (the alert), with the API underneath. The price drop is simulated, and the short says so on screen and out loud.

*0–3s. The inbox, with the email “[Simulated] Price Watch: target price reached…” open. Zoom on the line “[Best Buy]: $109.99 → $104.99”. On-screen text: “Demo · simulated drop”.*

This email tells me a store just dropped below my price. Here’s how it works, in under a minute.

*3–15s. App, search for `Logitech MX Master 3S graphite`, then Inspect offers (footage from scene 4). On-screen text: “2 SearchApi calls”.*

I search the product with SearchApi’s Google Shopping API, then pull every store’s offer with Google Product.

*15–23s. Tick the listings. If one was skipped in the long take, show it. On-screen text: “Same product only”.*

I keep only the listings that are really the same product. Otherwise the lowest price is wrong.

*23–30s. Type `105` in Target price. Add to watchlist. Then Settings, “How often: Every day”.*

I set a target, a hundred and five dollars, and the app checks the prices every day.

*30–45s. Click “Simulate next day” four times (footage from scene 8, sped up 2x). The yellow banner must be visible. On-screen text: “Fast-forward (simulated)”.*

Prices don’t drop on cue, so I’m fast-forwarding with a simulation. Day four: [Best Buy] cuts to a hundred and four ninety-nine.

*45–52s. Back to the inbox, the email from the opening. The subject with “[Simulated]” visible.*

Target reached, and the email lands. With real data, it’s the same two API calls, once a day.

*52–55s. Camera, vertical. On-screen text: “Full build on the channel”.*

The full build is on the channel.

*Spoken words: about 125, roughly 55 seconds.*

## Do not

- Cut the “simulated” labels out of Short 2. The banner, the on-screen text or the subject must be visible whenever the drop is on screen.
- Show a price or store name that isn’t in your footage.
- Say the free allowance unless you checked the pricing page that week.
