/**
 * Local Telegram bot — long polling (no HTTPS webhook required).
 *
 * Usage:
 *   set -a && source .env && set +a
 *   pnpm telegram:poll
 */
import {
  deleteTelegramWebhook,
  getTelegramUpdates,
  setTelegramBotCommands,
} from "../lib/telegram/api";
import { TELEGRAM_BOT_COMMANDS } from "../lib/telegram/commands";
import { handleTelegramUpdate } from "../lib/telegram/handler";

async function main() {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN ontbreekt in .env");
    process.exit(1);
  }

  await deleteTelegramWebhook();
  await setTelegramBotCommands([...TELEGRAM_BOT_COMMANDS]);
  console.log("Telegram polling gestart. Druk Ctrl+C om te stoppen.");
  console.log("Commando's: /start, /restart, /reset");

  let offset: number | undefined;

  while (true) {
    try {
      const updates = await getTelegramUpdates(offset, 30);
      for (const update of updates) {
        offset = update.update_id + 1;
        await handleTelegramUpdate(update).catch((error) => {
          console.error("Update error:", error);
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      if (message.includes("Conflict") || message.includes("getUpdates")) {
        console.error(
          "\n❌ Er draait al een andere Telegram-poll voor deze bot.\n" +
            "   Stop de andere instantie (andere terminal / webhook) en probeer opnieuw.\n"
        );
        process.exit(1);
      }
      console.error("Polling error:", error);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main();
