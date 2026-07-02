import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, stepCountIs, tool, type ModelMessage } from "ai";
import { z } from "zod";
import { buildTelegramAgentPrompt } from "@/lib/agent/telegram-prompt";
import { commerceActions } from "@/lib/magento/actions";
import { runWithSessionScope } from "@/lib/magento/session-store";
import type { CheckoutHandoff } from "./types";
import {
  getConversation,
  setConversation,
  telegramSessionScope,
} from "./conversation-store";

import { requireGoogleApiKey, syncGoogleApiKeyEnv } from "@/lib/env";

const telegramTools = {
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
    execute: async ({ searchTerm }) =>
      commerceActions.searchProducts(searchTerm),
  }),

  add_to_cart: tool({
    description:
      "Skill stap 4–6: Voeg product toe aan sessie-winkelwagen (POST /checkout/cart/add/). " +
      "NIET GraphQL addSimpleProductsToCart. Min. €5 — quantity wordt automatisch berekend.",
    inputSchema: z.object({
      sku: z.string(),
      quantity: z.number().int().positive().optional(),
    }),
    execute: async ({ sku, quantity }) =>
      commerceActions.addToCart(sku, quantity),
  }),

  init_postnl_checkout: tool({
    description:
      "Skill stap 7–8: Start PostNL Fast Checkout → orderId + checkoutUrl deeplink. " +
      "Adres/bezorging in PostNL-app vanuit PostNL-account. Alleen na userConfirmed=true.",
    inputSchema: z.object({
      userConfirmed: z.boolean(),
    }),
    execute: async ({ userConfirmed }) =>
      commerceActions.initPostnlCheckout(userConfirmed),
  }),
};

function extractCheckoutHandoff(
  steps: Array<{ toolResults?: Array<{ output: unknown }> }> | undefined
): CheckoutHandoff | null {
  for (const step of steps ?? []) {
    for (const result of step.toolResults ?? []) {
      const output = result.output as {
        success?: boolean;
        checkoutUrl?: string;
        orderId?: string;
      };
      if (output?.success && output.checkoutUrl && output.orderId) {
        return {
          checkoutUrl: output.checkoutUrl,
          orderId: output.orderId,
        };
      }
    }
  }
  return null;
}

function shouldOfferConfirmation(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("klopt dit") ||
    lower.includes("antwoord met ja") ||
    lower.includes("akkoord") ||
    lower.includes("postnl-app")
  );
}

export interface TelegramAgentResult {
  reply: string;
  checkout?: CheckoutHandoff;
  offerConfirmation?: boolean;
}

export async function runTelegramAgent(
  chatId: number,
  userText: string
): Promise<TelegramAgentResult> {
  return runWithSessionScope(telegramSessionScope(chatId), async () => {
    syncGoogleApiKeyEnv();
    const google = createGoogleGenerativeAI({
      apiKey: requireGoogleApiKey("Telegram"),
    });
    const history = getConversation(chatId);

    const messages: ModelMessage[] = [
      ...history,
      { role: "user", content: userText },
    ];

    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: buildTelegramAgentPrompt(),
      messages,
      tools: telegramTools,
      stopWhen: stepCountIs(10),
    });

    setConversation(chatId, [
      ...messages,
      { role: "assistant", content: result.text },
    ]);

    const checkout = extractCheckoutHandoff(result.steps);
    const reply =
      result.text.trim() ||
      (checkout
        ? `Je bestelling staat klaar (${checkout.orderId}). Open de PostNL-app via de knop — daar vul je je adres in vanuit je PostNL-account en rond je af.`
        : "Ik kon geen antwoord genereren. Probeer het opnieuw.");

    return {
      reply,
      checkout: checkout ?? undefined,
      offerConfirmation: !checkout && shouldOfferConfirmation(reply),
    };
  });
}

export async function confirmTelegramCheckout(
  chatId: number
): Promise<TelegramAgentResult> {
  return runTelegramAgent(
    chatId,
    "ja, akkoord — start PostNL Checkout en geef me de deeplink voor de PostNL-app"
  );
}
