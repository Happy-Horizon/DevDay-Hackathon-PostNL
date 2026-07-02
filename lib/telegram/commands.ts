export const TELEGRAM_BOT_COMMANDS = [
  { command: "start", description: "Welkom en nieuwe sessie" },
  { command: "restart", description: "Opnieuw beginnen vanaf nul" },
  { command: "reset", description: "Gesprek en winkelwagen wissen" },
] as const;

export type TelegramBotCommand =
  (typeof TELEGRAM_BOT_COMMANDS)[number]["command"];

/** Strip @BotName suffix from commands in groups. */
export function parseTelegramCommand(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return null;
  const command = trimmed.split(/\s+/)[0]?.split("@")[0]?.toLowerCase();
  return command ?? null;
}

export function isRestartCommand(command: string): boolean {
  return command === "/start" || command === "/restart" || command === "/reset";
}
