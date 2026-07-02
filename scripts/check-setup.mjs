#!/usr/bin/env node
/**
 * Validates environment before starting the app.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const envPath = resolve(root, ".env");

function parseEnvFile(path) {
  const vars = new Map();
  if (!existsSync(path)) return vars;

  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    vars.set(key, value);
  }
  return vars;
}

function resolveGoogleKey(fileVars, processEnv) {
  const fromProcess = [
    processEnv.GOOGLE_API_KEY,
    processEnv.GOOGLE_GENERATIVE_AI_API_KEY,
  ];
  const fromFile = [
    fileVars.get("GOOGLE_API_KEY"),
    fileVars.get("GOOGLE_GENERATIVE_AI_API_KEY"),
  ];

  for (const value of [...fromProcess, ...fromFile]) {
    if (value?.trim()) return value.trim();
  }
  return "";
}

async function testGoogleApiKey(key) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }],
      }),
    }
  );

  if (response.ok) return { ok: true };

  const body = await response.json().catch(() => ({}));
  const message = body?.error?.message ?? `HTTP ${response.status}`;
  return { ok: false, message };
}

const fileVars = parseEnvFile(envPath);
const googleKey = resolveGoogleKey(fileVars, process.env);

const errors = [];
const warnings = [];

if (!existsSync(envPath)) {
  errors.push("`.env` ontbreekt. Kopieer `.env.example` naar `.env`.");
}

const emptyGoogleApiKeyInFile =
  fileVars.has("GOOGLE_API_KEY") && !fileVars.get("GOOGLE_API_KEY")?.trim();
const hasGenerativeKey = Boolean(
  fileVars.get("GOOGLE_GENERATIVE_AI_API_KEY")?.trim()
);

if (emptyGoogleApiKeyInFile && hasGenerativeKey) {
  warnings.push(
    "`.env` heeft een lege GOOGLE_API_KEY regel — verwijder die of vul hem in."
  );
}

if (!googleKey) {
  errors.push(
    "Geen Gemini API key. Zet GOOGLE_GENERATIVE_AI_API_KEY in `.env`."
  );
} else if (!googleKey.startsWith("AIza")) {
  errors.push(
    `Je API key begint met "${googleKey.slice(0, 4)}..." — dat is geen geldige Google AI Studio key. ` +
      `Keys beginnen met "AIza". Maak er een op https://aistudio.google.com/apikey`
  );
}

if (!process.env.AUTH_TOKEN?.trim() && !fileVars.get("AUTH_TOKEN")?.trim()) {
  warnings.push(
    "AUTH_TOKEN ontbreekt — `pnpm install` faalt voor @design-system. Exporteer AUTH_TOKEN vóór install."
  );
}

for (const message of warnings) {
  console.warn(`⚠️  ${message}`);
}

if (errors.length > 0) {
  console.error("\n❌ Setup check mislukt:\n");
  for (const message of errors) {
    console.error(`   • ${message}`);
  }
  console.error("\nDaarna: pnpm dev\n");
  process.exit(1);
}

const result = await testGoogleApiKey(googleKey);
if (!result.ok) {
  console.error("\n❌ Gemini API key test mislukt:\n");
  console.error(`   • ${result.message}`);
  console.error(
    "\n   Vraag een nieuwe key aan op https://aistudio.google.com/apikey\n"
  );
  process.exit(1);
}

console.log("✓ Setup check OK (Gemini API key werkt)");
