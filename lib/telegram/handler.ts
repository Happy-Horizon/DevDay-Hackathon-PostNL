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
  sendTelegramMessage,
} from "./api";
import { parseTelegramCommand } from "./commands";

const WELCOME_MESSAGE = `Hoi! Ik ben je PostNL shopping-assistent.

Vertel me wat je zoekt — bijvoorbeeld:
"Ik wil een cadeau voor mijn moeder, budget €40"

Ik zoek producten, zet ze in je winkelwagen en stuur je een PostNL Checkout-deeplink (postnl-fast-checkout skill). Adres en betaling regel je in de PostNL-app vanuit je PostNL-account.

Commando's: /restart — opnieuw beginnen`;

const RESTART_MESSAGE = `Oké, we beginnen opnieuw! 🔄

Je gesprek en winkelwagen zijn gewist. Wat wil je bestellen?`;

const CHECKOUT_MESSAGE = (orderId: string) =>
  `✅ Bestelling klaar!\n\nOrder: ${orderId}\n\nOpen de PostNL-app via de knop hieronder. Daar kies je je bezorgadres (uit je PostNL-account) en rond je de betaling af.\n\n${NEW_ORDER_HINT}`;

const NEW_ORDER_HINT =
  "Stuur een nieuw bericht of /restart wanneer je weer wilt bestellen.";

async function restartSession(
  chatId: number,
  message: string
): Promise<void> {
  resetTelegramChatSession(chatId);
  await sendTelegramMessage(chatId, message);
}

async function sendAgentReply(
  chatId: number,
  result: Awaited<ReturnType<typeof runTelegramAgent>>
): Promise<void> {
  const text = result.checkout
    ? CHECKOUT_MESSAGE(result.checkout.orderId)
    : result.reply;

  await sendTelegramMessage(chatId, text, {
    replyMarkup: result.checkout
      ? checkoutKeyboard(result.checkout.checkoutUrl)
      : result.offerConfirmation
        ? confirmOrderKeyboard()
        : undefined,
    disableWebPagePreview: !result.checkout,
  });

  if (result.checkout) {
    markOrderCompleted(chatId);
  }
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
      const result = await confirmTelegramCheckout(chatId);
      await sendAgentReply(chatId, result);
      return;
    }

    if (data === "cancel_order") {
      await restartSession(
        chatId,
        "Geannuleerd. Stuur een nieuw bericht of typ /restart om opnieuw te beginnen."
      );
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

  const result = await runTelegramAgent(chatId, text);
  await sendAgentReply(chatId, result);
}
