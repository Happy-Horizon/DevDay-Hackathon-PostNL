import type {
  InlineKeyboardMarkup,
  TelegramUpdate,
} from "./types";

const TELEGRAM_API = "https://api.telegram.org";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is niet geconfigureerd.");
  }
  return token;
}

async function telegramRequest<T>(
  method: string,
  body?: Record<string, unknown>
): Promise<T> {
  const token = getBotToken();
  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = (await response.json()) as {
    ok: boolean;
    result?: T;
    description?: string;
  };

  if (!data.ok) {
    throw new Error(data.description ?? `Telegram API ${method} mislukt.`);
  }

  return data.result as T;
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  options?: {
    replyMarkup?: InlineKeyboardMarkup;
    disableWebPagePreview?: boolean;
  }
): Promise<void> {
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: options?.disableWebPagePreview ?? false,
    reply_markup: options?.replyMarkup,
  });
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await telegramRequest("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
    show_alert: false,
  });
}

export async function setTelegramWebhook(
  url: string,
  secretToken?: string
): Promise<void> {
  await telegramRequest("setWebhook", {
    url,
    secret_token: secretToken,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function deleteTelegramWebhook(): Promise<void> {
  await telegramRequest("deleteWebhook", { drop_pending_updates: true });
}

export async function getTelegramUpdates(
  offset?: number,
  timeout = 30
): Promise<TelegramUpdate[]> {
  return telegramRequest<TelegramUpdate[]>("getUpdates", {
    offset,
    timeout,
    allowed_updates: ["message", "callback_query"],
  });
}

export async function setTelegramBotCommands(
  commands: Array<{ command: string; description: string }>
): Promise<void> {
  await telegramRequest("setMyCommands", { commands });
}

export function checkoutKeyboard(
  checkoutUrl: string,
  options?: { skipToPayment?: boolean }
): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        {
          text: options?.skipToPayment
            ? "Betalen in PostNL-app →"
            : "Afronden in PostNL-app →",
          url: checkoutUrl,
        },
      ],
    ],
  };
}

export function reorderConfirmKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Ja, opnieuw bestellen", callback_data: "confirm_reorder" },
        { text: "Nee", callback_data: "cancel_order" },
      ],
    ],
  };
}

export function confirmOrderKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Ja, akkoord", callback_data: "confirm_order" },
        { text: "Annuleren", callback_data: "cancel_order" },
      ],
    ],
  };
}
