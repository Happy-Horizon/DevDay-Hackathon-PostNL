# PostNL Hackathon Starter — Agent-to-UI × Stamp

A conversational shipping interface that demonstrates how an LLM (Gemini 2.5 Flash) can generate on-brand PostNL Stamp components based on user intent.

Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, **Stamp** (`@design-system/react`), and the **Vercel AI SDK**.

---

## Screens

| Landing | Category prompts | Typing |
|---|---|---|
| Greeting + composer + category grid | Drill into category-specific prompts | Input active state with send button |

| Chat / Loading | Destination selector | Offer card |
|---|---|---|
| User bubble + Gemini loading state | Adaptive country picker block | Price breakdown + confirm/decline |

---

## Quick start

### Prerequisites

- Node.js 20+ / pnpm 10
- `AUTH_TOKEN` — PostNL Stamp registry token (from hackathon organizers)
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key ([get one free](https://aistudio.google.com))

### Setup

```bash
cp .env.example .env
# Edit .env and fill in both tokens

export AUTH_TOKEN=<your_token>
pnpm install

pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

> **No API key?** The app includes a scripted fallback conversation that demonstrates all screens without requiring Gemini. Just leave `GOOGLE_GENERATIVE_AI_API_KEY` empty.

---

## Architecture

```
User message → POST /api/chat
                    │
          lib/stamp-catalog.ts (semantic component descriptions)
          lib/ui-schema.ts     (Zod UISpec schema)
                    │
              Gemini 2.5 Flash
                    │
              UISpec JSON
                    │
      components/adaptive/AdaptiveRenderer.tsx
                    │
         @design-system/react (Stamp)
```

## Key files

| File | Purpose |
|---|---|
| `lib/stamp-catalog.ts` | Semantic catalog — teach the LLM about Stamp components |
| `lib/ui-schema.ts` | Zod schema for the UISpec (shared between API and renderer) |
| `components/adaptive/AdaptiveRenderer.tsx` | Renders UISpec blocks as Stamp components |
| `app/api/chat/route.ts` | Next.js route handler (Gemini + scripted fallback) |

---

## Hackathon

DevDay 2026 has two PostNL hackathon tracks:

| Track | Briefing |
|---|---|
| **Agent-to-UI × PostNL** (this repo) | [`docs/HACKATHON_BRIEFING.md`](docs/HACKATHON_BRIEFING.md) |
| **Agentic Commerce × PostNL** (OpenClaw + Gemini) | [`docs/HACKATHON_BRIEFING_AGENTIC_COMMERCE.md`](docs/HACKATHON_BRIEFING_AGENTIC_COMMERCE.md) |
