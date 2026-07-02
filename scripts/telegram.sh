#!/usr/bin/env bash
# Launch Telegram bot (long polling) with Node 20 + .env loaded.
#
# Usage:
#   ./scripts/telegram.sh
#   pnpm telegram:poll

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${GOOGLE_API_KEY:-}" && -n "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]]; then
  export GOOGLE_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY"
fi


export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  if ! nvm use 20 >/dev/null 2>&1; then
    echo "❌ Node 20 niet gevonden. Installeer met: nvm install 20"
    exit 1
  fi
  export PATH="$NVM_DIR/versions/node/$(nvm version)/bin:$PATH"
fi

NODE_BIN="$(command -v node || true)"
PNPM_BIN="$(command -v pnpm || true)"

if [[ -z "$NODE_BIN" ]]; then
  echo "❌ node niet gevonden. Installeer Node 20 (bijv. via nvm)."
  exit 1
fi

NODE_MAJOR="$("$NODE_BIN" -p "process.versions.node.split('.')[0]")"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "❌ Node $("$NODE_BIN" -v) gedetecteerd — Node 20+ vereist."
  echo "   Run: nvm use 20"
  exit 1
fi

if [[ -z "$PNPM_BIN" ]]; then
  echo "❌ pnpm niet gevonden. Installeer met:"
  echo "   npm install -g pnpm@10.32.1 --prefix \"$NVM_DIR/versions/node/$(nvm version 2>/dev/null || echo v20)\""
  exit 1
fi

if [[ -z "${TELEGRAM_BOT_TOKEN:-}" ]]; then
  echo "❌ TELEGRAM_BOT_TOKEN ontbreekt in .env"
  echo "   Maak een bot via @BotFather en plak het token in .env"
  exit 1
fi

if [[ -z "${GOOGLE_API_KEY:-}" && -z "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]]; then
  echo "❌ Gemini API key ontbreekt (GOOGLE_GENERATIVE_AI_API_KEY in .env)"
  echo "   Nodig voor de shopping agent. Key aanmaken: https://aistudio.google.com/apikey"
  exit 1
fi

echo "✓ Node $("$NODE_BIN" -v)"
echo "✓ pnpm $("$PNPM_BIN" -v)"
echo "✓ Telegram bot token geladen"
echo ""
echo "Telegram polling gestart (Ctrl+C om te stoppen)..."
echo ""

exec "$PNPM_BIN" exec tsx scripts/telegram-poll.ts "$@"
