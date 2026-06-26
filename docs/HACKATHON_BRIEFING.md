# Hackathon — Agent-to-UI × PostNL

> **Wat als de interface zichzelf bouwt?**  
> Laat een LLM on-brand PostNL-componenten genereren op basis van intentie.

---

## De uitdaging

Conversational interfaces bij PostNL praten nu vooral in tekst. Maar wat als de interface zichzelf genereert op basis van context? Eén bericht — _"Ik wil een pakket versturen"_ — en het systeem stelt automatisch de juiste interface samen, met de juiste interactiepatronen, volledig binnen het PostNL design system.

Het centrale probleem is een kolfje naar de hand van frontend developers: **design systems zijn ontworpen voor mensen, niet voor taalmodellen.** Hoe geef je een LLM genoeg context over componenten, gebruik en constraints, zodat het betrouwbaar on-brand keuzes maakt?

Je werkt met **CopilotKit v2** en **Google A2UI** als technische basis, en met **Stamp**, het echte design system van PostNL.

---

## Wat je in een dag kunt bouwen

1. **Een semantische component-bibliotheek**  
   Stamp-componenten zo beschrijven dat een LLM intent, gebruik en beperkingen écht snapt.

2. **Een intent-to-UI pipeline**  
   Van gebruikersbericht naar automatisch gegenereerde, passende interface — via A2UI.

3. **Een validatietest**  
   Hoe consistent en on-brand zijn de resultaten — en waar gaat het (nog) mis?

---

## Succesvol als…

- Stamp-componenten correct getriggerd worden op intentie.
- De UI on-brand aanvoelt zonder handmatige correctie.
- Je helder kunt laten zien waar het wél en niet werkt.

---

## Voor wie

Frontend developers, UX'ers en prompt engineers. Affiniteit met design systems is een grote plus.

---

## Technische setup

### Vereisten

- Node.js 20+ / pnpm 10+
- Toegang tot de PostNL Stamp registry (`AUTH_TOKEN` — zie coördinator)
- Google Gemini API-sleutel (`GOOGLE_API_KEY` — gratis op [aistudio.google.com](https://aistudio.google.com))

### Installatie

```bash
# Kloon de starter
git clone <repo-url>
cd postnl

# Kopieer de omgevingsvariabelen
cp .env.example .env
# Vul AUTH_TOKEN en GOOGLE_API_KEY in

# Exporteer AUTH_TOKEN voor de Stamp registry
export AUTH_TOKEN=<jouw_token>
pnpm install

# Start de dev-server
pnpm dev
```

Open `http://localhost:3000` in je browser.

---

## Architectuur

```
Gebruiker typt een bericht
    │
    ▼
POST /api/copilotkit  (CopilotKit Runtime v2)
    │
    ├── app/api/copilotkit/runtime.ts
    │     └── BuiltInAgent  ←  model: google/gemini-2.5-flash
    │           └── system prompt: PostNL-assistent in het Nederlands
    │
    ├── lib/a2ui/definitions.ts   ← Zod-schema's per Stamp-component (jouw focus!)
    ├── lib/a2ui/renderers.tsx    ← React-renderers voor elk component
    └── lib/a2ui/catalog.ts       ← Koppelt definitions + renderers via createCatalog()
    │
    ▼
A2UI renderer (via @copilotkit/a2ui-renderer)
    │
    ▼
@design-system/react Stamp-componenten in de chat
```

### Sleutelbestanden

| Bestand | Rol |
|---|---|
| `lib/a2ui/definitions.ts` | Zod-schema's + beschrijvingen per component — **jouw primaire werkterrein** |
| `lib/a2ui/renderers.tsx` | React-componenten die A2UI-output renderen naar Stamp |
| `lib/a2ui/catalog.ts` | Koppelt definitions en renderers via `createCatalog()` |
| `app/api/copilotkit/runtime.ts` | CopilotKit Runtime: model, system prompt, A2UI-configuratie |
| `app/page.tsx` | Hoofd-UI: landing → categorie → chat-flow |
| `components/chat/ChatInterface.tsx` | Chat-berichtenstroom met CopilotKit hooks |
| `lib/categories.ts` | Categorieën en voorbeeldberichten voor de landing-grid |

---

## Hoe de catalogus werkt

In `lib/a2ui/definitions.ts` definieer je elk Stamp-component met een Zod-schema en een menselijke beschrijving:

```typescript
import { z } from "zod";
import type { CatalogDefinitions } from "@copilotkit/a2ui-renderer";

export const stampDefinitions = {
  TrackingCard: {
    description:
      "Shows a PostNL parcel tracking status: barcode, current status label, and optional estimated delivery date. Use this when the user asks about their package.",
    props: z.object({
      barcode: z.string(),
      status: z.string(),
      estimatedDelivery: z.string().optional(),
    }),
  },
  // ... meer componenten
} satisfies CatalogDefinitions;
```

De `description` is wat Gemini ziet — **de kwaliteit van jouw beschrijvingen bepaalt direct hoe betrouwbaar het model on-brand componenten kiest.**

In `lib/a2ui/renderers.tsx` schrijf je de bijbehorende React-renderer:

```typescript
export const stampRenderers: CatalogRenderers<StampDefinitions> = {
  TrackingCard: ({ props }) => (
    <div className="rounded-xl border ...">
      <Heading level={3} size="s">Pakketstatus</Heading>
      <LabelBasic>{props.status}</LabelBasic>
    </div>
  ),
};
```

Tot slot koppel je alles in `lib/a2ui/catalog.ts`:

```typescript
export const stampCatalog = createCatalog(stampDefinitions, stampRenderers, {
  catalogId: "postnl-stamp",
  includeBasicCatalog: true, // voegt tekst, knoppen etc. toe via A2UI basis
});
```

---

## Beschikbare componenten (starter)

| Component | Wanneer gebruiken |
|---|---|
| `TrackingCard` | Gebruiker vraagt naar pakketstatus — toont barcode, status, bezorgdatum |
| `PriceRow` | Eén regel in een prijsoverzicht (label + bedrag). Meerdere `PriceRow`s vormen een prijstabel |
| `ServiceCard` | Eén verzendoptie met naam, omschrijving, prijs en optionele badge |

Daarnaast zijn via `includeBasicCatalog: true` standaard A2UI-primitieven beschikbaar zoals `Text`, `Button`, `Link` en `Image`.

---

## Nieuwe componenten toevoegen

Voeg een nieuw Stamp-component toe in drie stappen:

**1. Definieer het schema** in `lib/a2ui/definitions.ts`:

```typescript
AddressForm: {
  description:
    "A form for entering a shipping address. Use when the user needs to provide a delivery address.",
  props: z.object({
    recipientName: z.string(),
    street: z.string(),
    houseNumber: z.string(),
    postalCode: z.string(),
    city: z.string(),
  }),
},
```

**2. Schrijf de renderer** in `lib/a2ui/renderers.tsx`:

```typescript
AddressForm: ({ props }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
    <Heading level={3} size="s">Bezorgadres</Heading>
    <Text size="s">{props.recipientName}</Text>
    <Text size="s">{props.street} {props.houseNumber}</Text>
    <Text size="s">{props.postalCode} {props.city}</Text>
  </div>
),
```

**3. TypeScript controleert automatisch** of je een component hebt gedefinieerd maar vergeten te renderen (compile-fout bij ontbrekende renderer) — dit is opzettelijk.

---

## Extensiepunten voor het hackathon-team

### 1. Verbeter de componentbeschrijvingen (makkelijk, grote impact)

Bewerk de `description`-velden in `lib/a2ui/definitions.ts`. Voeg specifiekere use-cases toe, geef context wanneer een component _niet_ gebruikt moet worden. Kijk hoe Gemini anders kiest.

Voorbeeld — te vaag:
```
"Shows a service card."
```

Beter:
```
"A PostNL shipping service option with name, short description, price, and optional badge (e.g. 'Aangeraden', 'Snel'). Use when presenting shipping options to choose from. Do NOT use for tracking or address information."
```

### 2. Voeg nieuwe componenten toe (medium)

Zie de stappen hierboven. Ideeën:

- `WeightPicker` — RadioButtonGroup voor pakketgewicht
- `DatePicker` — Kalender voor bezorgdatum
- `ConfirmationCard` — Afrondingsscherm met bestelnummer
- `ServicepointMap` — Kaart met ServicePunten in de buurt

### 3. Verfijn het system-prompt (makkelijk)

In `app/api/copilotkit/runtime.ts` staat de `prompt` van de `BuiltInAgent`. Experimenteer met:

- Expliciete instructies over wanneer componenten gebruikt moeten worden
- Persona en toon (formeel/informeel, proactief/reactief)
- Stap-voor-stap flows (vraag altijd naar gewicht voordat je een `ServiceCard` toont)

### 4. Breid de landing-grid uit (makkelijk)

In `lib/categories.ts` staan de categorieën en voorbeeldberichten. Voeg categorieën toe, pas prompts aan, of voeg meer realistische scenario's toe.

### 5. Streaming UI (geavanceerd)

CopilotKit ondersteunt streaming out-of-the-box. Experimenteer met het stapsgewijs opbouwen van de interface terwijl Gemini antwoord geeft.

### 6. Multi-turn flows (geavanceerd)

Laat de agent bij ontbrekende informatie doorvragen voordat hij componenten rendert:

- "Naar welk land wil je versturen?"
- "Wat is het gewicht van het pakket?"
- Dan pas: `ServiceCard` met de juiste opties

---

## Nuttige links

- [Stamp design system documentatie](https://pnl.gitlab.schubergphilis.com) (intern)
- [CopilotKit documentatie](https://docs.copilotkit.ai) — runtime, hooks, A2UI
- [Google A2UI](https://a2ui.org) — Agent-to-UI protocol spec
- [Google Gemini API](https://aistudio.google.com) — Gratis API-sleutels
- [PostNL ontwikkelaarsdocumentatie](https://developer.postnl.nl)

---

## Opzet van de hackathon-dag

1. Kick-off & uitleg van de challenge
2. Teams instellen, repos forken, dev-omgeving opzetten
3. Bouw-sessie deel 1: catalogus en pipeline
4. Lunch
5. Bouw-sessie deel 2: verfijning en validatie
6. Demo's voorbereiden
7. Presentaties (5 min per team)
8. Beoordeling, awards & afsluiting

---

*PostNL Hackathon 2026 — Agent-to-UI × Stamp*
