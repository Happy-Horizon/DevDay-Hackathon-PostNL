import { commerceActions } from "@/lib/magento/actions";
import { runWithSessionScope } from "@/lib/magento/session-store";
import { getProductsAvailability } from "@/lib/magento/client";
import { performAddToCart } from "./cart-flow";
import { telegramSessionScope } from "./conversation-store";
import { getLastOrder, saveCartSnapshot } from "./order-history";
import { applyBackgroundPostnlCheck } from "./postnl-check";
import {
  formatShippingAddress,
  getOrderState,
  setOrderState,
  type OrderLineItem,
} from "./order-state";

export interface ReorderLineStatus {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  available: boolean;
  reason?: string;
}

export interface ReorderCheckResult {
  success: boolean;
  hasLastOrder: boolean;
  orderId?: string;
  completedAt?: string;
  shippingAddress?: string;
  items: ReorderLineStatus[];
  allAvailable: boolean;
  message: string;
}

/** Dutch/English phrases for ordering the same item(s) again. */
export function isReorderIntent(text: string): boolean {
  const lower = text.toLowerCase().trim();

  const patterns = [
    /\bopnieuw\s+bestel/,
    /\bopnieuw\s+doen\b/,
    /\breorder\b/,
    /\bzelfde\s+(als|weer|nog|product|bestelling)/,
    /\bnog\s*(een|1|één)\s+bestel/,
    /\bnog\s*(een|1|één)\s*$/, // "er nog 1" / "nog 1"
    /\ber\s+nog\s*(een|1|één)\b/,
    /\bnogmaals\b/,
    /\bnog\s+een\s+keer\b/,
    /\bnoch\s+een\b/,
    /\b(bestel|bestellen).*\bnog\b/,
    /\bnog.*\b(bestel|bestellen)\b/,
    /\banother\s+one\b/,
    /\border\s+again\b/,
    /\bsame\s+again\b/,
  ];

  return patterns.some((pattern) => pattern.test(lower));
}

export function checkLastOrderForReorder(chatId: number): ReorderCheckResult {
  const lastOrder = getLastOrder(chatId);

  if (!lastOrder) {
    return {
      success: false,
      hasLastOrder: false,
      items: [],
      allAvailable: false,
      message:
        "Ik heb nog geen eerdere bestelling van je. Bestel eerst iets, daarna kun je opnieuw bestellen.",
    };
  }

  return {
    success: true,
    hasLastOrder: true,
    orderId: lastOrder.orderId,
    completedAt: lastOrder.completedAt,
    shippingAddress: lastOrder.shippingAddress
      ? formatShippingAddress(lastOrder.shippingAddress)
      : undefined,
    items: lastOrder.items.map((item) => ({
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
      available: true,
    })),
    allAvailable: true,
    message: "Laatste order gevonden — beschikbaarheid wordt gecontroleerd.",
  };
}

export async function checkLastOrderAvailability(
  chatId: number
): Promise<ReorderCheckResult> {
  const base = checkLastOrderForReorder(chatId);
  if (!base.hasLastOrder) {
    return base;
  }

  const lastOrder = getLastOrder(chatId)!;
  const availability = await getProductsAvailability(
    lastOrder.items.map((item) => item.sku)
  );
  const availabilityBySku = new Map(availability.map((a) => [a.sku, a]));

  const items: ReorderLineStatus[] = lastOrder.items.map((item) => {
    const status = availabilityBySku.get(item.sku);
    return {
      sku: item.sku,
      name: status?.name ?? item.name,
      quantity: item.quantity,
      unitPrice: status?.price ?? item.unitPrice,
      currency: status?.currency ?? item.currency,
      available: status?.available ?? false,
      reason: status?.reason,
    };
  });

  const allAvailable = items.every((item) => item.available);
  const lines = items
    .map((item, index) => {
      const price = `€${item.unitPrice.toFixed(2)}`;
      const status = item.available ? "✓ beschikbaar" : `✗ ${item.reason}`;
      return `${index + 1}. ${item.quantity}× ${item.name} (${item.sku}) — ${price} — ${status}`;
    })
    .join("\n");

  const addressNote = base.shippingAddress
    ? `\nBezorgadres vorige keer: ${base.shippingAddress}`
    : "";

  return {
    success: true,
    hasLastOrder: true,
    orderId: lastOrder.orderId,
    completedAt: lastOrder.completedAt,
    shippingAddress: base.shippingAddress,
    items,
    allAvailable,
    message: allAvailable
      ? `Je laatste bestelling (${lastOrder.orderId}):\n${lines}${addressNote}\n\nAlles is nog beschikbaar. Bedoel je deze producten opnieuw te bestellen?`
      : `Je laatste bestelling (${lastOrder.orderId}):\n${lines}${addressNote}\n\nNiet alles is nog beschikbaar. Wil je de beschikbare producten opnieuw bestellen?`,
  };
}

export async function executeReorder(
  chatId: number,
  userId?: number
): Promise<{
  success: boolean;
  message: string;
  addedSkus: string[];
}> {
  return runWithSessionScope(telegramSessionScope(chatId), async () => {
    const check = await checkLastOrderAvailability(chatId);
    if (!check.hasLastOrder) {
      return { success: false, message: check.message, addedSkus: [] };
    }

    const toAdd = check.items.filter((item) => item.available);
    if (toAdd.length === 0) {
      return {
        success: false,
        message:
          "Geen producten uit je vorige bestelling zijn nog beschikbaar om opnieuw te bestellen.",
        addedSkus: [],
      };
    }

    await commerceActions.initMagentoSession();

    const addedSkus: string[] = [];
    const cartItems: OrderLineItem[] = [];
    let subtotal = 0;
    let lastReply = "";

    for (const item of toAdd) {
      const flow = await performAddToCart(
        chatId,
        userId,
        item.sku,
        item.quantity
      );
      if (!flow.success) {
        return {
          success: false,
          message:
            flow.error ??
            `Kon ${item.name} niet toevoegen. Probeer het opnieuw of zoek het product.`,
          addedSkus,
        };
      }
      addedSkus.push(item.sku);
      cartItems.push({
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currency: item.currency,
      });
      lastReply = flow.reply;
      const state = getOrderState(chatId);
      subtotal = state.cartTotal ?? subtotal;
    }

    const lastOrder = getLastOrder(chatId);
    if (lastOrder?.shippingAddress) {
      setOrderState(chatId, {
        shippingAddress: lastOrder.shippingAddress,
      });
    }

    await applyBackgroundPostnlCheck(chatId, userId);

    setOrderState(chatId, {
      cartItems,
      cartSku: cartItems[0]?.sku ?? null,
      cartTotal: subtotal,
    });

    saveCartSnapshot(chatId, {
      items: cartItems,
      shippingAddress: getOrderState(chatId).shippingAddress,
      subtotal,
      currency: "EUR",
    });

    const skipped = check.items.filter((item) => !item.available);
    const skippedNote =
      skipped.length > 0
        ? `\n\nNiet toegevoegd (niet beschikbaar): ${skipped.map((s) => s.name).join(", ")}.`
        : "";

    return {
      success: true,
      addedSkus,
      message: `${lastReply}${skippedNote}\n\nWil je doorgaan met afrekenen?`,
    };
  });
}
