import {
  MAGENTO_STORE_URL,
  MIN_CART_TOTAL_EUR,
  USER_AGENT,
} from "./config";
import {
  clearActiveSession,
  getActiveSession,
  setActiveSession,
} from "./session-store";
import type {
  CartSummary,
  CheckoutResult,
  DeliveryEstimate,
  GuestShippingAddressInput,
  MagentoSession,
  SimpleProduct,
} from "./types";

function extractCookie(setCookieHeader: string | null, name: string): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match?.[1] ?? null;
}

function extractFormKey(html: string): string | null {
  const patterns = [
    /name="form_key"\s+type="hidden"\s+value="([^"]+)"/,
    /name="form_key"\s+value="([^"]+)"/,
    /form_key[^<]*value="([^"]+)"/,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function calculateMinQuantity(unitPrice: number): number {
  if (unitPrice <= 0) return 1;
  return Math.max(1, Math.ceil(MIN_CART_TOTAL_EUR / unitPrice));
}

export async function createMagentoSession(): Promise<MagentoSession> {
  const headResponse = await fetch(`${MAGENTO_STORE_URL}/`, {
    method: "HEAD",
    headers: { "User-Agent": USER_AGENT },
    redirect: "manual",
  });

  const setCookie = headResponse.headers.get("set-cookie");
  const phpsessid = extractCookie(setCookie, "PHPSESSID");
  if (!phpsessid) {
    throw new Error("Kon geen PHPSESSID ophalen van de Magento-store.");
  }

  const pageResponse = await fetch(`${MAGENTO_STORE_URL}/`, {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: `PHPSESSID=${phpsessid}`,
    },
  });

  const html = await pageResponse.text();
  const formKey = extractFormKey(html);
  if (!formKey) {
    throw new Error("Kon geen form_key ophalen van de Magento-store.");
  }

  const session = { phpsessid, formKey };
  setActiveSession(session);
  return session;
}

async function ensureSession(): Promise<MagentoSession> {
  const existing = getActiveSession();
  if (existing) return existing;
  return createMagentoSession();
}

function sessionCookie(session: MagentoSession): string {
  return `PHPSESSID=${session.phpsessid}; form_key=${session.formKey}`;
}

export async function searchProducts(searchTerm: string): Promise<SimpleProduct[]> {
  const query = `{
    products(search: "${searchTerm.replace(/"/g, '\\"')}") {
      items {
        __typename
        sku
        name
        price_range {
          minimum_price {
            regular_price {
              value
              currency
            }
          }
        }
      }
    }
  }`;

  const response = await fetch(
    `${MAGENTO_STORE_URL}/graphql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Productzoekopdracht mislukt (${response.status}).`);
  }

  const data = (await response.json()) as {
    data?: {
      products?: {
        items?: Array<{
          __typename?: string;
          sku?: string;
          name?: string;
          price_range?: {
            minimum_price?: {
              regular_price?: { value?: number; currency?: string };
            };
          };
        }>;
      };
    };
  };

  return (data.data?.products?.items ?? [])
    .filter((item) => item.__typename === "SimpleProduct" && item.sku && item.name)
    .map((item) => ({
      sku: item.sku!,
      name: item.name!,
      price: item.price_range?.minimum_price?.regular_price?.value ?? 0,
      currency:
        item.price_range?.minimum_price?.regular_price?.currency ?? "EUR",
    }))
    .slice(0, 10);
}

export async function getProductId(sku: string): Promise<string> {
  const query = `{
    products(filter: { sku: { eq: "${sku.replace(/"/g, '\\"')}" } }) {
      items { id sku name }
    }
  }`;

  const response = await fetch(
    `${MAGENTO_STORE_URL}/graphql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Product-ID ophalen mislukt (${response.status}).`);
  }

  const data = (await response.json()) as {
    data?: { products?: { items?: Array<{ id?: string }> } };
  };

  const id = data.data?.products?.items?.[0]?.id;
  if (!id) {
    throw new Error(`Geen product gevonden met SKU ${sku}.`);
  }
  return id;
}

export async function addProductToCart(
  sku: string,
  quantity?: number
): Promise<{ session: MagentoSession; cart: CartSummary; quantity: number }> {
  const session = await ensureSession();

  const idQuery = `{
    products(filter: { sku: { eq: "${sku.replace(/"/g, '\\"')}" } }) {
      items {
        __typename
        id
        sku
        name
        price_range {
          minimum_price {
            regular_price { value currency }
          }
        }
      }
    }
  }`;

  const idResponse = await fetch(
    `${MAGENTO_STORE_URL}/graphql?query=${encodeURIComponent(idQuery)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    }
  );

  if (!idResponse.ok) {
    throw new Error(`Product ophalen mislukt (${idResponse.status}).`);
  }

  const idData = (await idResponse.json()) as {
    data?: {
      products?: {
        items?: Array<{
          __typename?: string;
          id?: string;
          sku?: string;
          name?: string;
          price_range?: {
            minimum_price?: { regular_price?: { value?: number } };
          };
        }>;
      };
    };
  };

  const item = idData.data?.products?.items?.[0];
  if (!item?.id || item.__typename !== "SimpleProduct") {
    throw new Error(
      `Product met SKU ${sku} niet gevonden of is geen SimpleProduct.`
    );
  }

  const unitPrice = item.price_range?.minimum_price?.regular_price?.value ?? 0;
  const qty = quantity ?? calculateMinQuantity(unitPrice);
  const productId = item.id;

  const body = new URLSearchParams({
    product: productId,
    qty: String(qty),
    form_key: session.formKey,
  });

  const addResponse = await fetch(`${MAGENTO_STORE_URL}/checkout/cart/add/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest",
      Accept: "*/*",
      "User-Agent": USER_AGENT,
      Cookie: sessionCookie(session),
    },
    body: body.toString(),
  });

  const addText = await addResponse.text();
  if (!addResponse.ok && addText !== "[]") {
    throw new Error(
      `Product toevoegen aan winkelwagen mislukt: ${addText.slice(0, 200)}`
    );
  }

  const cart = await getCartSummary(session);
  if (cart.itemCount === 0) {
    throw new Error(
      "Winkelwagen is leeg na toevoegen — sessie mogelijk verlopen."
    );
  }

  if (cart.subtotal < MIN_CART_TOTAL_EUR) {
    throw new Error(
      `Minimale winkelwagenwaarde is €${MIN_CART_TOTAL_EUR.toFixed(2)}. Huidig totaal: €${cart.subtotal.toFixed(2)}.`
    );
  }

  return { session, cart, quantity: qty };
}

export async function getCartSummary(session?: MagentoSession): Promise<CartSummary> {
  const active = session ?? (await ensureSession());
  const timestamp = Date.now();

  const response = await fetch(
    `${MAGENTO_STORE_URL}/customer/section/load/?sections=cart%2Cdirectory-data%2Cmessages&force_new_section_timestamp=true&_=${timestamp}`,
    {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": USER_AGENT,
        Cookie: sessionCookie(active),
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Winkelwagen ophalen mislukt (${response.status}).`);
  }

  const data = (await response.json()) as {
    cart?: {
      summary_count?: number;
      subtotalAmount?: number;
      subtotal?: string;
      braintree_masked_id?: string;
    };
  };

  const subtotalRaw = data.cart?.subtotalAmount ?? data.cart?.subtotal ?? "0";
  const subtotal =
    typeof subtotalRaw === "number"
      ? subtotalRaw
      : parseFloat(String(subtotalRaw).replace(/[^\d.,]/g, "").replace(",", ".")) || 0;

  return {
    itemCount: data.cart?.summary_count ?? 0,
    subtotal,
    currency: "EUR",
    braintreeMaskedId: data.cart?.braintree_masked_id,
  };
}

export async function setGuestShippingAddress(
  address: GuestShippingAddressInput,
  session?: MagentoSession
): Promise<void> {
  const active = session ?? (await ensureSession());
  const cart = await getCartSummary(active);

  if (!cart.braintreeMaskedId) {
    throw new Error(
      "Geen winkelwagen gevonden — voeg eerst een product toe voordat je het adres instelt."
    );
  }

  const payload = {
    addressInformation: {
      shipping_address: {
        region: "",
        region_id: 0,
        country_id: "NL",
        street: [address.street],
        postcode: address.postalCode.replace(/\s/g, "").toUpperCase(),
        city: address.city,
        firstname: address.firstName ?? "PostNL",
        lastname: address.lastName ?? "Klant",
        email: address.email ?? "guest@postnl-checkout.local",
        telephone: address.telephone ?? "0612345678",
      },
      billing_address: {
        region: "",
        region_id: 0,
        country_id: "NL",
        street: [address.street],
        postcode: address.postalCode.replace(/\s/g, "").toUpperCase(),
        city: address.city,
        firstname: address.firstName ?? "PostNL",
        lastname: address.lastName ?? "Klant",
        email: address.email ?? "guest@postnl-checkout.local",
        telephone: address.telephone ?? "0612345678",
      },
      shipping_method_code: "flatrate",
      shipping_carrier_code: "flatrate",
    },
  };

  const response = await fetch(
    `${MAGENTO_STORE_URL}/rest/V1/guest-carts/${cart.braintreeMaskedId}/shipping-information`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        Cookie: sessionCookie(active),
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Bezorgadres instellen mislukt (${response.status}): ${text.slice(0, 200)}`
    );
  }
}

export interface ProductAvailability {
  sku: string;
  name: string;
  price: number;
  currency: string;
  available: boolean;
  isSimpleProduct: boolean;
  reason?: string;
}

export async function getProductAvailability(
  sku: string
): Promise<ProductAvailability> {
  const query = `{
    products(filter: { sku: { eq: "${sku.replace(/"/g, '\\"')}" } }) {
      items {
        __typename
        sku
        name
        stock_status
        price_range {
          minimum_price {
            regular_price { value currency }
          }
        }
      }
    }
  }`;

  const response = await fetch(
    `${MAGENTO_STORE_URL}/graphql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Productbeschikbaarheid ophalen mislukt (${response.status}).`);
  }

  const data = (await response.json()) as {
    data?: {
      products?: {
        items?: Array<{
          __typename?: string;
          sku?: string;
          name?: string;
          stock_status?: string;
          price_range?: {
            minimum_price?: {
              regular_price?: { value?: number; currency?: string };
            };
          };
        }>;
      };
    };
  };

  const item = data.data?.products?.items?.[0];
  if (!item?.sku || !item.name) {
    return {
      sku,
      name: sku,
      price: 0,
      currency: "EUR",
      available: false,
      isSimpleProduct: false,
      reason: "Product niet meer gevonden in de webshop.",
    };
  }

  const isSimpleProduct = item.__typename === "SimpleProduct";
  const inStock = item.stock_status === "IN_STOCK";
  const available = isSimpleProduct && inStock;

  return {
    sku: item.sku,
    name: item.name,
    price: item.price_range?.minimum_price?.regular_price?.value ?? 0,
    currency:
      item.price_range?.minimum_price?.regular_price?.currency ?? "EUR",
    available,
    isSimpleProduct,
    reason: available
      ? undefined
      : !isSimpleProduct
        ? "Geen SimpleProduct — niet via Fast Checkout te bestellen."
        : "Niet op voorraad.",
  };
}

export async function getProductsAvailability(
  skus: string[]
): Promise<ProductAvailability[]> {
  const unique = [...new Set(skus.filter(Boolean))];
  return Promise.all(unique.map((sku) => getProductAvailability(sku)));
}

export async function initPostnlCheckout(
  options?: {
    shippingAddress?: GuestShippingAddressInput;
    skipAddressConfirmation?: boolean;
  }
): Promise<CheckoutResult> {
  const shippingAddress = options?.shippingAddress;
  const skipAddressConfirmation = options?.skipAddressConfirmation ?? false;
  const session = await ensureSession();
  const cart = await getCartSummary(session);

  if (shippingAddress) {
    await setGuestShippingAddress(shippingAddress, session);
  }

  if (cart.itemCount === 0) {
    clearActiveSession();
    throw new Error("EMPTY_CART: Winkelwagen is leeg. Voeg eerst een product toe.");
  }

  const initHeaders: Record<string, string> = {
    Accept: "*/*",
    "X-Requested-With": "XMLHttpRequest",
    Origin: MAGENTO_STORE_URL,
    Referer: `${MAGENTO_STORE_URL}/`,
    "User-Agent": USER_AGENT,
    Cookie: sessionCookie(session),
  };

  let initBody: string | undefined;
  if (skipAddressConfirmation && shippingAddress) {
    initHeaders["Content-Type"] = "application/json";
    initBody = JSON.stringify({
      shippingAddressConfirmed: true,
      skipAddressConfirmation: true,
    });
  } else {
    initHeaders["Content-Length"] = "0";
  }

  const response = await fetch(
    `${MAGENTO_STORE_URL}/postnl_fastcheckout/checkout/init`,
    {
      method: "POST",
      headers: initHeaders,
      body: initBody,
    }
  );

  if (response.status === 404) {
    clearActiveSession();
    throw new Error("Sessie verlopen. Start de checkout opnieuw.");
  }

  const result = (await response.json()) as {
    success?: boolean;
    data?: { orderId?: string; checkoutUrl?: string; cartId?: string };
    message?: string;
    error?: string;
  };

  if (!result.success) {
    const errorMsg = result.message ?? result.error ?? "Onbekende fout";
    if (errorMsg.includes("Minimum amount is 5")) {
      throw new Error(
        `Minimale winkelwagenwaarde is €${MIN_CART_TOTAL_EUR.toFixed(2)}. Verhoog de hoeveelheid.`
      );
    }
    if (errorMsg.includes("EMPTY_CART")) {
      clearActiveSession();
      throw new Error("EMPTY_CART: Gebruik de sessie-winkelwagen, niet GraphQL-cart.");
    }
    throw new Error(`PostNL Checkout init mislukt: ${errorMsg}`);
  }

  const orderId = result.data?.orderId;
  const checkoutUrl = result.data?.checkoutUrl;
  if (!orderId || !checkoutUrl) {
    throw new Error("PostNL Checkout gaf geen orderId of checkoutUrl terug.");
  }

  return {
    orderId,
    checkoutUrl,
    cartId: result.data?.cartId,
    skipToPayment: skipAddressConfirmation,
  };
}

export function estimateDelivery(
  postalCode: string,
  city?: string
): DeliveryEstimate {
  const normalized = postalCode.replace(/\s/g, "").toUpperCase();
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + (normalized.startsWith("1") ? 1 : 2));

  while (deliveryDate.getDay() === 0 || deliveryDate.getDay() === 6) {
    deliveryDate.setDate(deliveryDate.getDate() + 1);
  }

  const formatted = deliveryDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return {
    deliveryDate: formatted,
    deliveryWindow: "17:00 – 22:00",
    serviceType: normalized.startsWith("1") ? "PostNL Vandaag" : "PostNL Standaard",
  };
}

export { clearActiveSession, getActiveSession };
