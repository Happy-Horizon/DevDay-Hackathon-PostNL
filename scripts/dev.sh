#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

# Prefer a non-empty generative key when GOOGLE_API_KEY is blank in .env
if [[ -z "${GOOGLE_API_KEY:-}" && -n "${GOOGLE_GENERATIVE_AI_API_KEY:-}" ]]; then
  export GOOGLE_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck disable=SC1091
  source "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || true
  export PATH="$NVM_DIR/versions/node/$(nvm version)/bin:$PATH"
fi

node scripts/check-setup.mjs
exec pnpm exec next dev "$@"
