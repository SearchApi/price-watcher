#!/usr/bin/env sh
# The two SearchApi requests behind Price Watch, as plain curl. Build your own tool from here.
# Usage: SEARCHAPI_API_KEY=... sh examples/requests.sh "Logitech MX Master 3S graphite" [us]
# Needs curl and jq. Request 1 costs one search, request 2 another one.
set -eu
: "${SEARCHAPI_API_KEY:?Set SEARCHAPI_API_KEY in your environment (never paste it on screen)}"
QUERY=${1:?Give a product query}; GL=${2:-us}
API=https://www.searchapi.io/api/v1/search

echo "# 1. Google Shopping: find the product and its product_token"
curl -s -G "$API" -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
  --data-urlencode "engine=google_shopping" --data-urlencode "q=$QUERY" \
  --data-urlencode "gl=$GL" --data-urlencode "hl=en" > /tmp/shopping.json
jq '.shopping_results[:5] | map({title, price, seller, product_id, product_token: (.product_token[:12] + "…")})' /tmp/shopping.json

echo "# 2. Google Product: every store offer for the first result"
TOKEN=$(jq -r '.shopping_results[0].product_token' /tmp/shopping.json)
curl -s -G "$API" -H "Authorization: Bearer $SEARCHAPI_API_KEY" \
  --data-urlencode "engine=google_product" --data-urlencode "product_token=$TOKEN" \
  --data-urlencode "gl=$GL" --data-urlencode "hl=en" > /tmp/product.json
jq '{product: .product.title, typical: {low: .typical_prices.low_price, high: .typical_prices.high_price, popular: .typical_prices.popular_choice}, offers: [.offers[] | {seller: .merchant.name, price, total_price, delivery: .delivery_price, link}]}' /tmp/product.json
rm -f /tmp/shopping.json /tmp/product.json
