/**
 * Resolves the Gemini API key from env.
 * Handles duplicate .env keys where an empty GOOGLE_API_KEY overrides a valid fallback.
 */
export function getGoogleApiKey(): string | undefined {
  const candidates = [
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  ];

  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  return undefined;
}

/** Google AI Studio keys typically start with AIza */
export function isLikelyValidGoogleApiKey(key: string): boolean {
  return key.startsWith("AIza") && key.length >= 30;
}

export function requireGoogleApiKey(context = "de agent"): string {
  const key = getGoogleApiKey();
  if (!key) {
    throw new Error(
      `GOOGLE_API_KEY ontbreekt. Zet GOOGLE_GENERATIVE_AI_API_KEY in .env (https://aistudio.google.com/apikey).`
    );
  }
  // if (!isLikelyValidGoogleApiKey(key)) {
  //   throw new Error(
  //     `Ongeldige Gemini API key voor ${context}. Keys van Google AI Studio beginnen met "AIza". ` +
  //       `Haal een gratis key op: https://aistudio.google.com/apikey — en zet die in GOOGLE_GENERATIVE_AI_API_KEY in .env.`
  //   );
  // }
  return key;
}

/** Ensure CopilotKit's google provider can read the key from GOOGLE_API_KEY */
export function syncGoogleApiKeyEnv(): string {
  const key = requireGoogleApiKey();
  process.env.GOOGLE_API_KEY ??= key;
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ??= key;
  return key;
}
