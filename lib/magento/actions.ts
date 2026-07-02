import {
  addProductToCart,
  calculateMinQuantity,
  createMagentoSession,
  estimateDelivery,
  getProductsAvailability,
  initPostnlCheckout,
  searchProducts,
  setGuestShippingAddress,
} from "./client";
import { buildPostnlCheckoutUrl } from "@/lib/postnl/checkout-url";
import type { GuestShippingAddressInput } from "./types";

export const commerceActions = {
  async initMagentoSession() {
    const session = await createMagentoSession();
    return {
      success: true,
      message: "Magento-sessie gestart.",
      sessionId: session.phpsessid.slice(0, 8) + "...",
    };
  },

  async searchProducts(searchTerm: string) {
    const products = await searchProducts(searchTerm);
    if (products.length === 0) {
      return {
        success: false,
        message: `Geen producten gevonden voor "${searchTerm}". Probeer een andere zoekterm.`,
        products: [],
      };
    }

    return {
      success: true,
      products: products.slice(0, 3).map((p, index) => ({
        index: index + 1,
        sku: p.sku,
        name: p.name,
        price: p.price,
        currency: p.currency,
        minQuantity: calculateMinQuantity(p.price),
        minTotal: calculateMinQuantity(p.price) * p.price,
      })),
      totalFound: products.length,
      note: "Minimale winkelwagenwaarde is €5,00.",
    };
  },

  async addToCart(sku: string, quantity?: number) {
    const result = await addProductToCart(sku, quantity);
    return {
      success: true,
      sku,
      quantity: result.quantity,
      cart: {
        itemCount: result.cart.itemCount,
        subtotal: result.cart.subtotal,
        currency: result.cart.currency,
      },
      message: `${result.quantity}× ${sku} toegevoegd. Totaal: €${result.cart.subtotal.toFixed(2)}.`,
    };
  },

  async estimateDelivery(postalCode: string, city?: string) {
    const estimate = estimateDelivery(postalCode, city);
    return {
      success: true,
      postalCode,
      city: city ?? null,
      ...estimate,
      message: `Verwachte bezorging: ${estimate.deliveryDate} (${estimate.serviceType}), ${estimate.deliveryWindow}.`,
    };
  },

  async setShippingAddress(address: GuestShippingAddressInput) {
    await setGuestShippingAddress(address);
    return {
      success: true,
      message: `Bezorgadres bijgewerkt: ${address.street}, ${address.postalCode} ${address.city}.`,
    };
  },

  async initPostnlCheckout(
    userConfirmed: boolean,
    options?: {
      shippingAddress?: GuestShippingAddressInput;
      skipAddressConfirmation?: boolean;
    }
  ) {
    if (!userConfirmed) {
      return {
        success: false,
        message:
          "Gebruiker heeft nog niet bevestigd. Vat de order samen en vraag expliciet om akkoord vóór checkout.",
      };
    }

    const skipAddressConfirmation = options?.skipAddressConfirmation ?? false;
    const checkout = await initPostnlCheckout({
      shippingAddress: options?.shippingAddress,
      skipAddressConfirmation,
    });

    const checkoutUrl = skipAddressConfirmation
      ? buildPostnlCheckoutUrl(checkout.checkoutUrl, { skipToPayment: true })
      : checkout.checkoutUrl;

    return {
      success: true,
      orderId: checkout.orderId,
      checkoutUrl,
      skipToPayment: skipAddressConfirmation,
      message: skipAddressConfirmation
        ? "PostNL Fast Checkout gestart. Deeplink opent direct bij betalen — bezorgadres staat al op de order."
        : "PostNL Fast Checkout gestart. De checkoutUrl is een deeplink naar de PostNL-app — daar kiest de gebruiker adres en betaling.",
    };
  },

  async checkProductsAvailability(skus: string[]) {
    const items = await getProductsAvailability(skus);
    return {
      success: true,
      items: items.map((item) => ({
        sku: item.sku,
        name: item.name,
        price: item.price,
        currency: item.currency,
        available: item.available,
        reason: item.reason ?? null,
      })),
    };
  },
};
