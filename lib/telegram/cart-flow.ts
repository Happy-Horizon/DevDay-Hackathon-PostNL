import { commerceActions } from "@/lib/magento/actions";
import { getProductAvailability } from "@/lib/magento/client";
import { runWithSessionScope } from "@/lib/magento/session-store";
import { applyBackgroundPostnlCheck } from "./postnl-check";
import {
  formatShippingAddress,
  getOrderState,
  isReadyForCheckout,
  setOrderState,
} from "./order-state";
import { telegramSessionScope } from "./conversation-store";
import { saveCartSnapshot } from "./order-history";
import { resolveProductSku } from "./product-selection";

export interface AddToCartFlowResult {
  success: boolean;
  reply: string;
  offerConfirmation?: boolean;
  sku?: string;
  error?: string;
}

export async function performAddToCart(
  chatId: number,
  userId: number | undefined,
  skuInput: string,
  quantity?: number
): Promise<AddToCartFlowResult> {
  return runWithSessionScope(telegramSessionScope(chatId), async () => {
    const resolvedSku = resolveProductSku(chatId, skuInput);
    if (!resolvedSku) {
      return {
        success: false,
        reply: "",
        error: `Kon geen geldige SKU bepalen voor "${skuInput}". Kies een nummer uit de lijst of geef de SKU (bijv. 24-WG087).`,
      };
    }

    try {
      const result = await commerceActions.addToCart(resolvedSku, quantity);
      const product = await getProductAvailability(resolvedSku);
      const postnl = await applyBackgroundPostnlCheck(chatId, userId);

      setOrderState(chatId, {
        cartSku: resolvedSku,
        cartTotal: result.cart.subtotal,
        cartItems: [
          {
            sku: resolvedSku,
            name: product.name,
            quantity: result.quantity,
            unitPrice: product.price,
            currency: product.currency,
          },
        ],
      });

      const state = getOrderState(chatId);
      saveCartSnapshot(chatId, {
        items: state.cartItems,
        shippingAddress: state.shippingAddress,
        subtotal: state.cartTotal,
        currency: product.currency,
      });

      let reply =
        `${result.quantity}× ${product.name} toegevoegd (SKU: ${resolvedSku}). ` +
        `Totaal: €${result.cart.subtotal.toFixed(2)}.`;

      const orderState = getOrderState(chatId);
      if (orderState.postnlSignedIn && orderState.shippingAddress) {
        reply += `\n\nBezorging naar: ${formatShippingAddress(orderState.shippingAddress)}`;
      }

      reply += "\n\nWil je doorgaan met afrekenen?";

      return {
        success: true,
        reply,
        sku: resolvedSku,
        offerConfirmation: isReadyForCheckout(chatId),
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Onbekende fout bij toevoegen.";
      return {
        success: false,
        reply: "",
        sku: resolvedSku,
        error: message,
      };
    }
  });
}
