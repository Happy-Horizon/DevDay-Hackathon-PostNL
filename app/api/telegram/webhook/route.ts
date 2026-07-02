import { handleTelegramUpdate } from "@/lib/telegram/handler";
import type { TelegramUpdate } from "@/lib/telegram/types";

export async function POST(request: Request) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return Response.json(
      { error: "TELEGRAM_BOT_TOKEN is not configured" },
      { status: 503 }
    );
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await handleTelegramUpdate(update);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[telegram/webhook]", error);
    return Response.json({ ok: true });
  }
}

export async function GET() {
  return Response.json({
    ok: true,
    configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    webhook: "/api/telegram/webhook",
  });
}
