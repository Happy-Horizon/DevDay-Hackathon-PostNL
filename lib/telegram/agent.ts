import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, stepCountIs, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { buildTelegramAgentPrompt } from "@/lib/agent/telegram-prompt";
import { commerceActions } from "@/lib/magento/actions";
import { performAddToCart } from "./cart-flow";
import type { GuestShippingAddressInput } from "@/lib/magento/types";
import { runWithSessionScope } from "@/lib/magento/session-store";
import {
  applyAlternateShippingAddress,
  startCustomAddressFlow,
} from "./address-flow";
import type { CheckoutHandoff } from "./types";
import {
  getConversation,
  setConversation,
  telegramSessionScope,
} from "./conversation-store";
import {
  extractToolLogsFromSteps,
  extractUsageFromGenerateResult,
  logAgentEvent,
} from "@/lib/logging/agent-logger";
import { getLastOrder } from "./order-history";
import {
  checkLastOrderAvailability,
  executeReorder,
  isReorderIntent,
} from "./reorder";
import { resolveProductSku } from "./product-selection";
import {
  formatShippingAddress,
  getCheckoutBlockReason,
  getOrderState,
  hasCartItems,
  isReadyForCheckout,
  setOrderState,
  shouldApplyShippingToOrder,
  type ShippingAddress,
} from "./order-state";

import { requireGoogleApiKey, syncGoogleApiKeyEnv } from "@/lib/env";

function toMagentoAddress(
  address: ShippingAddress
): GuestShippingAddressInput | null {
  if (!address.street || !address.postalCode || !address.city) {
    return null;
  }

  return {
    street: address.street,
    postalCode: address.postalCode,
    city: address.city,
  };
}

function buildTelegramTools(chatId: number, userId?: number) {
  return {
    init_magento_session: tool({
      description:
        "Skill stap 1–2: Start Magento-sessie (PHPSESSID + form_key). " +
        "Roep aan vóór eerste cart-actie of bij sessiefout/404.",
      inputSchema: z.object({}),
      execute: async () => commerceActions.initMagentoSession(),
    }),

    search_products: tool({
      description:
        "Skill stap 3: Zoek SimpleProducts via GraphQL op trefwoord. " +
        "Filter op __typename SimpleProduct. Max 3 tonen aan gebruiker.",
      inputSchema: z.object({
        searchTerm: z.string(),
      }),
      execute: async ({ searchTerm }) => {
        const result = await commerceActions.searchProducts(searchTerm);
        if (result.success && result.products.length > 0) {
          setOrderState(chatId, {
            lastSearchProducts: result.products.map((p) => ({
              index: p.index,
              sku: p.sku,
              name: p.name,
              price: p.price,
              currency: p.currency,
            })),
          });
        }
        return result;
      },
    }),

    add_to_cart: tool({
      description:
        "Skill stap 4–6: Voeg product toe aan sessie-winkelwagen (POST /checkout/cart/add/). " +
        "Gebruik ALTIJD de exacte SKU uit search_products (bijv. 24-WG087), of het lijstnummer als sku. " +
        "Min. €5 — quantity wordt automatisch berekend.",
      inputSchema: z.object({
        sku: z.string().describe("Exacte Magento SKU of lijstnummer (1-3)"),
        quantity: z.number().int().positive().optional(),
      }),
      execute: async ({ sku, quantity }) => {
        const flow = await performAddToCart(chatId, userId, sku, quantity);
        if (!flow.success) {
          return { success: false, message: flow.error ?? "Toevoegen mislukt." };
        }
        return {
          success: true,
          sku: flow.sku,
          message: flow.reply,
        };
      },
    }),

    lookup_last_order: tool({
      description:
        "Gebruik bij reorder/opnieuw bestellen/zelfde als vorige keer. " +
        "Haalt de laatste bestelling op en controleert of producten nog beschikbaar zijn.",
      inputSchema: z.object({}),
      execute: async () => checkLastOrderAvailability(chatId),
    }),

    reorder_last_order: tool({
      description:
        "Voeg producten van de laatste bestelling opnieuw toe aan de winkelwagen. " +
        "Alleen na bevestiging van de gebruiker.",
      inputSchema: z.object({
        userConfirmed: z.boolean(),
      }),
      execute: async ({ userConfirmed }) => {
        if (!userConfirmed) {
          return {
            success: false,
            message:
              "Gebruiker moet eerst bevestigen dat ze de vorige bestelling opnieuw willen.",
          };
        }
        return executeReorder(chatId, userId);
      },
    }),

    update_shipping_address: tool({
      description:
        "Wijzig het bezorgadres op de order wanneer de gebruiker een ander adres wil. " +
        "Formaat: Straat 1, 1234AB Plaats",
      inputSchema: z.object({
        addressLine: z.string(),
      }),
      execute: async ({ addressLine }) => {
        const result = applyAlternateShippingAddress(chatId, addressLine);
        if ("error" in result) {
          return { success: false, message: result.error };
        }
        return { success: true, message: result.message };
      },
    }),

    request_alternate_address: tool({
      description:
        "Start flow wanneer gebruiker een ander bezorgadres wil intypen.",
      inputSchema: z.object({}),
      execute: async () => startCustomAddressFlow(chatId),
    }),

    init_postnl_checkout: tool({
      description:
        "Skill stap 7–8: Start PostNL Fast Checkout → orderId + checkoutUrl deeplink. " +
        "Alleen na userConfirmed=true. Past bevestigd PostNL-adres toe op de order vóór init.",
      inputSchema: z.object({
        userConfirmed: z.boolean(),
      }),
      execute: async ({ userConfirmed }) => {
        const blockReason = getCheckoutBlockReason(chatId);
        if (blockReason) {
          return { success: false, message: blockReason };
        }

        if (!userConfirmed) {
          return {
            success: false,
            message:
              "Gebruiker heeft nog niet bevestigd. Vraag expliciet om akkoord vóór checkout.",
          };
        }

        const state = getOrderState(chatId);
        const shippingAddress =
          shouldApplyShippingToOrder(chatId) && state.shippingAddress
            ? toMagentoAddress(state.shippingAddress)
            : null;

        if (shouldApplyShippingToOrder(chatId) && !shippingAddress) {
          return {
            success: false,
            message:
              "Bezorgadres ontbreekt of is onvolledig. Gebruik update_shipping_address.",
          };
        }

        const skipAddressConfirmation = shouldApplyShippingToOrder(chatId);

        return commerceActions.initPostnlCheckout(true, {
          shippingAddress: shippingAddress ?? undefined,
          skipAddressConfirmation,
        });
      },
    }),
  };
}

function extractCheckoutHandoff(
  steps: Array<{ toolResults?: Array<{ output: unknown }> }> | undefined
): (CheckoutHandoff & { skipToPayment?: boolean }) | null {
  for (const step of steps ?? []) {
    for (const result of step.toolResults ?? []) {
      const output = result.output as {
        success?: boolean;
        checkoutUrl?: string;
        orderId?: string;
        skipToPayment?: boolean;
      };
      if (output?.success && output.checkoutUrl && output.orderId) {
        return {
          checkoutUrl: output.checkoutUrl,
          orderId: output.orderId,
          skipToPayment: output.skipToPayment,
        };
      }
    }
  }
  return null;
}

function cartWasAdded(
  steps: Array<{ toolResults?: Array<{ toolName?: string; output: unknown }> }> | undefined
): boolean {
  for (const step of steps ?? []) {
    for (const result of step.toolResults ?? []) {
      if (result.toolName === "add_to_cart") {
        const output = result.output as { success?: boolean };
        if (output?.success) return true;
      }
    }
  }
  return false;
}

function reorderWasExecuted(
  steps: Array<{ toolResults?: Array<{ toolName?: string; output: unknown }> }> | undefined
): boolean {
  for (const step of steps ?? []) {
    for (const result of step.toolResults ?? []) {
      if (result.toolName === "reorder_last_order") {
        const output = result.output as { success?: boolean };
        if (output?.success) return true;
      }
    }
  }
  return false;
}

function shouldOfferConfirmation(
  text: string,
  chatId: number,
  cartJustAdded: boolean,
  reorderJustExecuted: boolean
): boolean {
  if (!isReadyForCheckout(chatId)) return false;
  if (cartJustAdded || reorderJustExecuted) return true;

  const lower = text.toLowerCase();
  return (
    lower.includes("klopt dit") ||
    lower.includes("antwoord met ja") ||
    lower.includes("akkoord") ||
    lower.includes("ordersamenvatting")
  );
}

function reorderWasLookedUp(
  steps: Array<{ toolResults?: Array<{ toolName?: string; output: unknown }> }> | undefined
): boolean {
  for (const step of steps ?? []) {
    for (const result of step.toolResults ?? []) {
      if (result.toolName === "lookup_last_order") {
        const output = result.output as { hasLastOrder?: boolean };
        if (output?.hasLastOrder) return true;
      }
    }
  }
  return false;
}

export interface TelegramAgentResult {
  reply: string;
  checkout?: CheckoutHandoff & { skipToPayment?: boolean };
  offerConfirmation?: boolean;
  offerReorderConfirmation?: boolean;
}

function buildOrderSummaryWithAddress(chatId: number, baseReply: string): string {
  const state = getOrderState(chatId);
  if (!state.shippingAddress || state.postnlSignedIn !== true) {
    return baseReply;
  }

  const addressLine = formatShippingAddress(state.shippingAddress);
  const prefix = `Bezorging naar: ${addressLine}`;
  if (baseReply.includes(addressLine)) {
    return baseReply;
  }

  return `${baseReply}\n\n${prefix}`;
}

export async function runTelegramAgent(
  chatId: number,
  userText: string,
  userId?: number
): Promise<TelegramAgentResult> {
  return runWithSessionScope(telegramSessionScope(chatId), async () => {
    const startedAt = Date.now();
    const sessionScope = telegramSessionScope(chatId);

    syncGoogleApiKeyEnv();
    const google = createGoogleGenerativeAI({
      apiKey: requireGoogleApiKey("Telegram"),
    });
    const history = getConversation(chatId);
    const orderState = getOrderState(chatId);

    const contextNote =
      orderState.phase !== "shopping" || orderState.postnlSignedIn !== null
        ? `\n\n[Orderstatus: fase=${orderState.phase}, postnlSignedIn=${orderState.postnlSignedIn}, adres=${orderState.shippingAddress ? formatShippingAddress(orderState.shippingAddress) : "geen"}]`
        : "";

    const resolvedSkuHint =
      orderState.lastSearchProducts.length > 0
        ? (() => {
            const resolved = resolveProductSku(chatId, userText);
            return resolved
              ? `\n\n[Productkeuze: gebruik SKU ${resolved} voor add_to_cart]`
              : "";
          })()
        : "";

    const reorderHint =
      isReorderIntent(userText) && getLastOrder(chatId)
        ? `\n\n[Gebruiker wil opnieuw bestellen. Roep lookup_last_order aan — laatste order: ${getLastOrder(chatId)!.items.map((i) => `${i.quantity}× ${i.name} (${i.sku})`).join(", ")}]`
        : "";

    const messages: ModelMessage[] = [
      ...history,
      { role: "user", content: userText + contextNote + resolvedSkuHint + reorderHint },
    ];

    logAgentEvent({
      timestamp: new Date().toISOString(),
      channel: "telegram",
      sessionScope,
      chatId,
      userId,
      model: "gemini-2.5-flash",
      request: userText,
      meta: { orderPhase: orderState.phase },
    });

    let result;
    try {
      result = await generateText({
        model: google("gemini-2.5-flash"),
        system: buildTelegramAgentPrompt(),
        messages,
        tools: buildTelegramTools(chatId, userId),
        stopWhen: stepCountIs(10),
      });
    } catch (error) {
      logAgentEvent({
        timestamp: new Date().toISOString(),
        channel: "telegram",
        sessionScope,
        chatId,
        userId,
        model: "gemini-2.5-flash",
        request: userText,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }

    setConversation(chatId, [
      ...history,
      { role: "user", content: userText },
      { role: "assistant", content: result.text },
    ]);

    const checkout = extractCheckoutHandoff(result.steps);
    const cartJustAdded = cartWasAdded(result.steps);
    const reorderLookedUp = reorderWasLookedUp(result.steps);
    const reorderJustExecuted = reorderWasExecuted(result.steps);
    let reply =
      result.text.trim() ||
      (checkout
        ? `Je bestelling staat klaar (${checkout.orderId}). Open de PostNL-app via de knop om af te ronden.`
        : "Ik kon geen antwoord genereren. Probeer het opnieuw.");

    reply = buildOrderSummaryWithAddress(chatId, reply);

    logAgentEvent({
      timestamp: new Date().toISOString(),
      channel: "telegram",
      sessionScope,
      chatId,
      userId,
      model: "gemini-2.5-flash",
      request: userText,
      response: reply,
      usage: extractUsageFromGenerateResult(result),
      tools: extractToolLogsFromSteps(result.steps),
      durationMs: Date.now() - startedAt,
      meta: {
        checkoutOrderId: checkout?.orderId ?? null,
        cartJustAdded,
        postnlSignedIn: getOrderState(chatId).postnlSignedIn,
      },
    });

    return {
      reply,
      checkout: checkout ?? undefined,
      offerConfirmation:
        !checkout &&
        shouldOfferConfirmation(
          reply,
          chatId,
          cartJustAdded,
          reorderJustExecuted
        ),
      offerReorderConfirmation: !checkout && reorderLookedUp,
    };
  });
}

export async function confirmTelegramCheckout(
  chatId: number,
  userId?: number
): Promise<TelegramAgentResult> {
  const blockReason = getCheckoutBlockReason(chatId);
  if (blockReason) {
    return { reply: blockReason };
  }

  if (!hasCartItems(chatId)) {
    return {
      reply:
        "Je winkelwagen is leeg. Kies eerst een product of zeg 'opnieuw bestellen'.",
    };
  }

  return runTelegramAgent(
    chatId,
    "ja, akkoord — start PostNL Checkout en geef me de deeplink voor de PostNL-app",
    userId
  );
}
