/**
 * Register Telegram webhook for production / ngrok.
 *
 * Usage:
 *   set -a && source .env && set +a
 *   pnpm telegram:webhook https://your-domain/api/telegram/webhook
 */
import { setTelegramWebhook } from "../lib/telegram/api";

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: pnpm telegram:webhook <https://your-host/api/telegram/webhook>");
    process.exit(1);
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN ontbreekt in .env");
    process.exit(1);
  }

  await setTelegramWebhook(url, process.env.TELEGRAM_WEBHOOK_SECRET);
  console.log(`Webhook gezet op ${url}`);
}

main();
