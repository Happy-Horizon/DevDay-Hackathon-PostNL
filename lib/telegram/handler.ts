import {
  beginNewOrderIfNeeded,
  markOrderCompleted,
  resetTelegramChatSession,
} from "./conversation-store";
import { confirmTelegramCheckout, runTelegramAgent } from "./agent";
import type { TelegramUpdate } from "./types";
import {
  answerCallbackQuery,
  checkoutKeyboard,
  confirmOrderKeyboard,
  reorderConfirmKeyboard,
  sendTelegramMessage,
} from "./api";
import { parseTelegramCommand } from "./commands";
import {
  confirmDefaultAddress,
  recordCustomAddress,
  startCustomAddressFlow,
} from "./address-flow";
import { applyBackgroundPostnlCheck } from "./postnl-check";
import { performAddToCart } from "./cart-flow";
import { formatShippingAddress, getOrderState, hasCartItems } from "./order-state";
import { isProductIndexSelection } from "./product-selection";
import {
  checkLastOrderAvailability,
  executeReorder,
  isReorderIntent,
} from "./reorder";

const WELCOME_MESSAGE = `Hoi! Ik ben je PostNL shopping-assistent.

Vertel me wat je zoekt — bijvoorbeeld:
"Ik wil een cadeau voor mijn moeder, budget €40"

Of zeg "opnieuw bestellen" voor je vorige order.

Commando's: /restart — opnieuw beginnen`;

const RESTART_MESSAGE = `Oké, we beginnen opnieuw! 🔄

Je gesprek en winkelwagen zijn gewist. Wat wil je bestellen?`;

const CHECKOUT_MESSAGE = (
  orderId: string,
  options?: { skipToPayment?: boolean; shippingAddress?: string }
) => {
  const paymentNote = options?.skipToPayment
    ? "Je bezorgadres staat al klaar — de PostNL-app opent direct bij betalen."
    : "Open de PostNL-app om je adres te bevestigen en te betalen.";
  const addressNote = options?.shippingAddress
    ? `\nBezorging naar: ${options.shippingAddress}`
    : "";

  return `✅ Bestelling klaar!\n\nOrder: ${orderId}${addressNote}\n\n${paymentNote}\n\nStuur een nieuw bericht of /restart wanneer je weer wilt bestellen.`;
};

async function restartSession(
  chatId: number,
  message: string
): Promise<void> {
  resetTelegramChatSession(chatId);
  await sendTelegramMessage(chatId, message);
}

async function ensurePostnlChecked(
  chatId: number,
  userId?: number
): Promise<void> {
  const state = getOrderState(chatId);
  if (!state.postnlCheckDone) {
    await applyBackgroundPostnlCheck(chatId, userId);
  }
}

async function sendAgentReply(
  chatId: number,
  result: Awaited<ReturnType<typeof runTelegramAgent>>
): Promise<void> {
  const state = getOrderState(chatId);
  const shippingAddress =
    state.shippingAddress && state.postnlSignedIn
      ? formatShippingAddress(state.shippingAddress)
      : undefined;

  const text = result.checkout
    ? CHECKOUT_MESSAGE(result.checkout.orderId, {
        skipToPayment: result.checkout.skipToPayment,
        shippingAddress,
      })
    : result.reply;

  await sendTelegramMessage(chatId, text, {
    replyMarkup: result.checkout
      ? checkoutKeyboard(result.checkout.checkoutUrl, {
          skipToPayment: result.checkout.skipToPayment,
        })
      : result.offerConfirmation
        ? confirmOrderKeyboard()
        : result.offerReorderConfirmation
          ? reorderConfirmKeyboard()
          : undefined,
    disableWebPagePreview: !result.checkout,
  });

  if (result.checkout) {
    markOrderCompleted(chatId, result.checkout.orderId);
  }
}

async function handleAddressPhaseMessage(
  chatId: number,
  text: string
): Promise<boolean> {
  const { phase } = getOrderState(chatId);

  if (phase === "awaiting_custom_address") {
    const result = recordCustomAddress(chatId, text);
    if ("error" in result) {
      await sendTelegramMessage(chatId, result.error);
      return true;
    }
    await sendTelegramMessage(chatId, result.message, {
      replyMarkup: confirmOrderKeyboard(),
    });
    return true;
  }

  return false;
}

export async function handleTelegramUpdate(
  update: TelegramUpdate
): Promise<void> {
  if (update.callback_query) {
    const { id, data, message, from } = update.callback_query;
    const chatId = message?.chat.id;
    if (!chatId) return;

    await answerCallbackQuery(id);

    if (data === "confirm_order") {
      beginNewOrderIfNeeded(chatId);
      if (!hasCartItems(chatId)) {
        await sendTelegramMessage(
          chatId,
          "Deze knop is verlopen of je winkelwagen is leeg. Zoek een product, kies een nummer uit de lijst, of zeg 'opnieuw bestellen'."
        );
        return;
      }
      const result = await confirmTelegramCheckout(chatId, from.id);
      await sendAgentReply(chatId, result);
      return;
    }

    if (data === "confirm_reorder") {
      beginNewOrderIfNeeded(chatId);
      const reorder = await executeReorder(chatId, from.id);
      await sendTelegramMessage(chatId, reorder.message, {
        replyMarkup:
          reorder.success && hasCartItems(chatId)
            ? confirmOrderKeyboard()
            : undefined,
      });
      return;
    }

    if (data === "cancel_order") {
      await restartSession(
        chatId,
        "Geannuleerd. Stuur een nieuw bericht of typ /restart om opnieuw te beginnen."
      );
      return;
    }

    if (data === "address_default_yes") {
      const result = confirmDefaultAddress(chatId, true);
      await sendTelegramMessage(chatId, result.message, {
        replyMarkup: confirmOrderKeyboard(),
      });
      return;
    }

    if (data === "address_default_no") {
      const result = startCustomAddressFlow(chatId);
      await sendTelegramMessage(chatId, result.message);
      return;
    }

    await sendTelegramMessage(
      chatId,
      `Hoi ${from.first_name ?? ""}! Stuur me wat je wilt bestellen.`
    );
    return;
  }

  const message = update.message;
  if (!message?.text || !message.chat) return;

  const chatId = message.chat.id;
  const userId = message.from?.id;
  const text = message.text.trim();
  const command = parseTelegramCommand(text);

  if (command === "/start") {
    await restartSession(chatId, WELCOME_MESSAGE);
    return;
  }

  if (command === "/restart") {
    await restartSession(chatId, RESTART_MESSAGE);
    return;
  }

  if (command === "/reset") {
    await restartSession(chatId, "Gesprek gereset. Wat wil je bestellen?");
    return;
  }

  beginNewOrderIfNeeded(chatId);
  await ensurePostnlChecked(chatId, userId);

  if (await handleAddressPhaseMessage(chatId, text)) {
    return;
  }

  if (isReorderIntent(text)) {
    const check = await checkLastOrderAvailability(chatId);
    await sendTelegramMessage(chatId, check.message, {
      replyMarkup: check.hasLastOrder ? reorderConfirmKeyboard() : undefined,
    });
    return;
  }

  if (isProductIndexSelection(text) && getOrderState(chatId).lastSearchProducts.length > 0) {
    const cart = await performAddToCart(chatId, userId, text);
    if (cart.success) {
      await sendTelegramMessage(chatId, cart.reply, {
        replyMarkup: cart.offerConfirmation ? confirmOrderKeyboard() : undefined,
      });
      return;
    }
    if (cart.error) {
      await sendTelegramMessage(chatId, cart.error);
      return;
    }
  }

  const result = await runTelegramAgent(chatId, text, userId);
  await sendAgentReply(chatId, result);
}
