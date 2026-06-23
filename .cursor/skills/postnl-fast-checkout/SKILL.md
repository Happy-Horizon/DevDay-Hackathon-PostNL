---
name: postnl-fast-checkout
description: End-to-end PostNL fast checkout flow on the Magento acceptance environment (magento-acc.pricetracking.net). Searches for a product by keyword, adds it to the guest cart, and initiates the PostNL fast checkout returning the deeplink URL. Use when testing postnl fastcheckout, magento checkout flow, or when the user wants to run a checkout test on magento-acc.pricetracking.net.
disable-model-invocation: true
---

# PostNL Fast Checkout

Full end-to-end checkout test on `https://magento-acc.pricetracking.net`.

**Minimum cart total: €5.00** — calculate quantity accordingly.

---

## Step 1: Get PHPSESSID

HEAD request only — no body needed:

```bash
curl -s -I 'https://magento-acc.pricetracking.net/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' \
  | grep -i 'set-cookie'
```

Extract `PHPSESSID` value from the `Set-Cookie` response header. Store as `SESSION_ID`.

---

## Step 2: Get form_key

The `form_key` CSRF token is embedded in the page HTML (needed for the POST in Step 6):

```bash
curl -s 'https://magento-acc.pricetracking.net/' \
  -H 'User-Agent: Mozilla/5.0 ...' \
  -b "PHPSESSID=SESSION_ID" \
  | grep -o 'form_key[^<]*value="[^"]*"' | head -1
```

Or try extracting from the `<input name="form_key" ...>` tag:

```bash
curl -s 'https://magento-acc.pricetracking.net/' -b "PHPSESSID=SESSION_ID" \
  | grep -oP '(?<=name="form_key" type="hidden" value=")[^"]+' | head -1
```

Store as `FORM_KEY`.

---

## Step 3: Search Products

**Ask the user: "What product are you searching for?"**

Query GraphQL including `__typename` to identify simple products:

```bash
SEARCH_TERM="yoga"  # replace with user input

curl -s -G 'https://magento-acc.pricetracking.net/graphql' \
  --data-urlencode 'query={ products(search: "'"$SEARCH_TERM"'") { items { __typename sku name price_range { minimum_price { regular_price { value currency } } } } } }' \
  -H 'Content-Type: application/json'
```

Filter the results client-side: keep only items where `__typename == "SimpleProduct"`.

Present the user a numbered list of matching simple products showing `name`, `sku`, and price.

**Ask the user: "Which product would you like to add to the cart? (enter SKU or number)"**

Store the selected `sku` as `PRODUCT_SKU` and `price` as `PRODUCT_PRICE`.

---

## Step 4: Calculate Quantity

Minimum cart total is **€5.00**. Calculate required quantity:

```
QUANTITY = ceil(5.00 / PRODUCT_PRICE)
```

Ensure `QUANTITY >= 1`. Inform the user: _"Adding QUANTITY × PRODUCT_SKU (€TOTAL total)"_.

---

## Step 5: Get Product Numeric ID

The frontend add-to-cart endpoint requires the numeric product ID (not SKU):

```bash
curl -s -G 'https://magento-acc.pricetracking.net/graphql' \
  --data-urlencode 'query={ products(filter: { sku: { eq: "PRODUCT_SKU" } }) { items { id sku name } } }' \
  -H 'Content-Type: application/json'
```

Extract `items[0].id`. Store as `PRODUCT_ID`.

---

## Step 6: Add Product to Cart (session-based)

**Important:** Use the Magento frontend endpoint, NOT GraphQL `addSimpleProductsToCart`.
The GraphQL cart token is separate from the PHP session — PostNL init reads the session cart.

```bash
curl -s -X POST 'https://magento-acc.pricetracking.net/checkout/cart/add/' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Accept: */*' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' \
  -b "PHPSESSID=SESSION_ID; form_key=FORM_KEY" \
  -d "product=PRODUCT_ID&qty=QUANTITY&form_key=FORM_KEY"
```

A response of `[]` means success. Any other response indicates an error.

Then re-fetch the section to confirm the cart is populated and get `braintree_masked_id`:

```bash
TIMESTAMP=$(date +%s%3N)

curl -s "https://magento-acc.pricetracking.net/customer/section/load/?sections=cart%2Cdirectory-data%2Cmultisafepay-payment-request%2Cmessages&force_new_section_timestamp=true&_=${TIMESTAMP}" \
  -H 'Accept: application/json, text/javascript, */*; q=0.01' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' \
  -b "PHPSESSID=SESSION_ID; form_key=FORM_KEY"
```

Verify `cart.summary_count > 0` and extract `cart.braintree_masked_id`.

---

## Step 7: Init PostNL Fast Checkout

```bash
curl -s -X POST 'https://magento-acc.pricetracking.net/postnl_fastcheckout/checkout/init' \
  -H 'Accept: */*' \
  -H 'X-Requested-With: XMLHttpRequest' \
  -H 'Content-Length: 0' \
  -H 'Origin: https://magento-acc.pricetracking.net' \
  -H 'Referer: https://magento-acc.pricetracking.net/' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36' \
  -b "PHPSESSID=SESSION_ID; form_key=FORM_KEY"
```

**Expected success response:**
```json
{
  "success": true,
  "data": {
    "orderId": "PNL-xxxxxxxx",
    "checkoutUrl": "https://dil-fast-checkout-test.postnl.nl/deeplink/checkout/PNL-xxxxxxxx",
    "cartId": "xxxxxxxx"
  }
}
```

If `success` is `false` and the error contains `'Minimum amount is 5'` — the cart total is below €5. Increase the quantity from Step 4 and redo Steps 6–7.

---

## Step 8: Return Result

Present the deeplink URL to the user:

> **PostNL Fast Checkout initiated!**
>
> Order ID: `PNL-xxxxxxxx`
> Checkout URL: `https://dil-fast-checkout-test.postnl.nl/deeplink/checkout/PNL-xxxxxxxx`
>
> Open the link above to complete the checkout.

---

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Minimum amount is 5` | Cart total < €5 | Increase quantity |
| Empty `braintree_masked_id` | Cart not yet created | Add item first, then re-fetch |
| `404` on init | Session expired | Restart from Step 1 |
| GraphQL `Could not find a cart` | Wrong `cart_id` | Re-fetch `braintree_masked_id` |
| PostNL init returns `EMPTY_CART` | Used GraphQL cart instead of session cart | Add via `POST /checkout/cart/add/` not GraphQL |
