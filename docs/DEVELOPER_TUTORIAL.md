# Developer Tutorial — PostNL Hackathon

> A practical, step-by-step guide for hackathon day.  
> Estimated time: **~3 hours** (Stap 1–4 in de ochtend, Stap 5–6 na de lunch)

---

## Overzicht

Je bouwt een conversational interface waarbij een LLM automatisch on-brand PostNL-componenten selecteert en rendert. De technische kern:

```
Gebruiker → CopilotKit BuiltInAgent (Gemini 2.5 Flash) → A2UI → Stamp-componenten
```

Jouw taak: de **componentcatalogus** uitbreiden zodat het model meer en betere keuzes kan maken.

---

## Stap 0 — Omgeving opzetten (09:30–10:00)

```bash
git clone <repo-url> && cd postnl
cp .env.example .env
```

Open `.env` en vul in:

```bash
AUTH_TOKEN=<token van coördinator>
GOOGLE_API_KEY=<jouw Gemini sleutel van aistudio.google.com>
```

```bash
export AUTH_TOKEN=$AUTH_TOKEN   # nodig voor de Stamp npm registry
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Je ziet de PostNL landing-pagina met een categorie-grid.

**Verificatie:** Klik op een categorie → kies een voorbeeldbericht → de chat opent en Gemini antwoordt in het Nederlands.

---

## Stap 1 — Verken de architectuur (10:00–10:30)

Open de drie kernbestanden van de catalogus:

### `lib/a2ui/definitions.ts`

Hier definieer je **wat** een component doet (voor het model):

```typescript
TrackingCard: {
  description:
    "Shows a PostNL parcel tracking status: barcode, current status label, and optional estimated delivery date. Use this when the user asks about their package.",
  props: z.object({
    barcode: z.string(),
    status: z.string(),
    estimatedDelivery: z.string().optional(),
  }),
},
```

### `lib/a2ui/renderers.tsx`

Hier definieer je **hoe** het component eruitziet (voor de browser):

```typescript
TrackingCard: ({ props }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 ...">
    <Heading level={3} size="s">Pakketstatus</Heading>
    <LabelBasic>{props.status}</LabelBasic>
    {props.estimatedDelivery && <Text size="s">Verwacht: {props.estimatedDelivery}</Text>}
  </div>
),
```

### `app/api/copilotkit/runtime.ts`

Hier configureer je het model en de system-prompt:

```typescript
new BuiltInAgent({
  model: "google/gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY,
  prompt: "Je bent een behulpzame PostNL-assistent ...",
})
```

**Opdracht:** Type in de chat: _"Ik zoek mijn pakket, barcode 3SPOST123456"_ en bekijk welk component Gemini kiest.

---

## Stap 2 — Verbeter een bestaande beschrijving (10:30–11:00)

De kwaliteit van de `description` bepaalt direct hoe betrouwbaar Gemini componenten selecteert.

Open `lib/a2ui/definitions.ts` en verbeter de `ServiceCard` beschrijving. Vergelijk:

**Vaag (starter):**
```typescript
description: "A PostNL shipping service option with name, short description, price, and optional badge.",
```

**Beter:**
```typescript
description:
  "A PostNL shipping service option card. Use when presenting one or more available shipping methods to a user who wants to send a package. " +
  "Each card shows the service name (e.g. 'Pakket Standaard'), a short description, a price, and an optional badge like 'Aangeraden' or 'Snel'. " +
  "Do NOT use for tracking, addresses, or general questions. " +
  "Render multiple ServiceCards side by side when there are multiple options.",
```

Sla op en test: _"Wat kost het om een pakket naar Duitsland te sturen?"_

**Doel:** Kijk of Gemini vaker `ServiceCard` triggert op relevante vragen en minder op irrelevante vragen.

---

## Stap 3 — Voeg een nieuw component toe (11:00–12:00)

We voegen een `ConfirmationCard` toe voor het afrondingsscherm.

### 3a. Definieer het schema

Voeg toe aan `lib/a2ui/definitions.ts`:

```typescript
ConfirmationCard: {
  description:
    "A confirmation screen shown after a user successfully completes a shipping order. " +
    "Shows an order reference number, service name, and a friendly success message. " +
    "Use this at the END of a conversation when the user has confirmed their choice. " +
    "Do NOT use it before the user has confirmed.",
  props: z.object({
    orderReference: z.string().describe("The unique order or booking reference, e.g. '3SPOST-2026-001'"),
    serviceName: z.string().describe("The name of the shipping service booked, e.g. 'Pakket Standaard'"),
    message: z.string().describe("A short confirmation message in Dutch, e.g. 'Je pakket is aangemeld!'"),
  }),
},
```

> **Tip:** `.describe()` op Zod-velden geeft het model extra context over wat elke prop inhoudt.

### 3b. Schrijf de renderer

Voeg toe aan `lib/a2ui/renderers.tsx`:

```typescript
import { CheckIcon } from "lucide-react"; // of een Stamp-icoon

ConfirmationCard: ({ props }) => (
  <div className="rounded-xl border border-green-200 bg-green-50 p-6 flex flex-col gap-3 w-full">
    <div className="flex items-center gap-3">
      <div className="bg-green-500 rounded-full p-1">
        <CheckIcon className="w-5 h-5 text-white" />
      </div>
      <Heading level={3} size="s" className="text-green-800">
        {props.message}
      </Heading>
    </div>
    <Text size="s" variant="subtle">
      Dienst: <strong>{props.serviceName}</strong>
    </Text>
    <Text size="s" variant="subtle">
      Referentie: <strong>{props.orderReference}</strong>
    </Text>
  </div>
),
```

### 3c. Test

TypeScript geeft een compile-fout als definitions en renderers niet overeenkomen — los die op, start de dev-server, en test:

_"Ik wil een Pakket Standaard boeken naar Amsterdam, alles is goed!"_

---

## Stap 4 — Verfijn het system-prompt (na de lunch, 13:00–13:45)

In `app/api/copilotkit/runtime.ts` staat de `prompt`. Dit is de persoonlijkheid en het gedrag van de agent.

**Doel:** Maak de agent meer proactief — laat hem doorvragen voordat hij componenten rendert.

Vervang de huidige prompt door:

```typescript
prompt: `
Je bent een vriendelijke PostNL-assistent die klanten helpt bij het versturen van pakketten.

Gedragsregels:
1. Vraag altijd naar het bestemmindsland als dat niet bekend is.
2. Vraag naar het gewicht van het pakket (in kg) als dat niet is opgegeven.
3. Toon pas ServiceCards als je zowel het land als het gewicht weet.
4. Gebruik TrackingCard wanneer een gebruiker naar een pakket vraagt met een barcode.
5. Gebruik ConfirmationCard alleen als de gebruiker expliciet bevestigt dat hij wil bestellen.
6. Antwoord altijd in het Nederlands, bondig en vriendelijk.
7. Gebruik de voornaam van de klant als die dat heeft opgegeven.
`.trim(),
```

**Test:** _"Ik wil een pakket versturen"_ — de agent moet nu doorvragen in plaats van direct ServiceCards te tonen.

---

## Stap 5 — Multi-turn flow bouwen (13:45–15:00)

Nu de agent doorvraagt, willen we de flow logischer maken. Experimenteer met een stap-voor-stap aanpak:

**Scenario:** Pakket versturen naar het buitenland

| Stap | Gebruiker | Agent |
|---|---|---|
| 1 | "Ik wil een pakket versturen" | Vraagt naar bestemmindsland |
| 2 | "Naar Duitsland" | Vraagt naar gewicht |
| 3 | "Ongeveer 2 kilo" | Toont drie `ServiceCard`s (Standaard, Express, Economy) |
| 4 | "Ik neem de Express" | Toont prijs-breakdown met `PriceRow`s |
| 5 | "Bevestigen" | Toont `ConfirmationCard` |

**Uitdaging:** Schrijf een prompt die dit gesprek consistent afhandelt, ook als de gebruiker stappen overslaat of in een andere volgorde antwoordt.

---

## Stap 6 — Validatie en edge cases (15:00–15:30)

Test je implementatie systematisch voordat je de demo bouwt.

### Checklist

**Component selectie:**
- [ ] TrackingCard verschijnt bij: _"Waar is mijn pakket? Code: 3SPOST123"_
- [ ] TrackingCard verschijnt NIET bij: _"Hoeveel kost versturen naar België?"_
- [ ] ServiceCard verschijnt bij: _"Wat zijn de opties voor een pakket van 3kg naar Spanje?"_
- [ ] ConfirmationCard verschijnt ALLEEN na expliciete bevestiging

**Taalconsistentie:**
- [ ] Alle agent-responses zijn in het Nederlands
- [ ] Componentinhoud (labels, berichten) is in het Nederlands

**Edge cases:**
- [ ] Wat doet de agent bij een onzinnige vraag? (_"Wat is de hoofdstad van Peru?"_)
- [ ] Wat doet de agent als de gebruiker halverwege van onderwerp wisselt?
- [ ] Hoe reageert de agent op incomplete barcodes?

### Noteer je bevindingen

Maak een lijst van:
- 3 situaties waar het goed werkt
- 3 situaties waar het faalt of onverwacht gedrag vertoont
- 1 concrete verbetering die je nog kunt doorvoeren

Dit zijn de meest interessante punten voor je demo.

---

## Demo voorbereiden (15:30–16:00)

Je presentatie duurt **5 minuten**. Houd het concreet:

1. **30 sec:** Wat hebben jullie gebouwd? (één zin)
2. **2 min:** Live demo — laat twee contrasterende scenario's zien (eentje dat werkt, eentje met een interessante fout)
3. **1 min:** Wat was de moeilijkste technische uitdaging?
4. **1 min:** Wat zou je met meer tijd doen?

**Tip:** Demonstreer het verschil tussen een vage en een precieze `description` — dat maakt de kracht van de aanpak direct zichtbaar.

---

## Veelgestelde vragen

**Gemini antwoordt niet / API-fout**  
Controleer of `GOOGLE_API_KEY` in `.env` staat en de server herstart is (`pnpm dev`).

**Component verschijnt niet in de chat**  
Check of het component in zowel `definitions.ts` als `renderers.tsx` staat. TypeScript geeft een fout als ze niet overeenkomen.

**Agent spreekt Engels**  
Voeg "Antwoord altijd in het Nederlands" toe aan de system-prompt in `runtime.ts`.

**Stamp-component importeert niet**  
Controleer of `AUTH_TOKEN` geëxporteerd was voor `pnpm install`. Zo niet: `export AUTH_TOKEN=... && pnpm install` opnieuw draaien.

**De agent negeert mijn instructies in de prompt**  
Maak de instructies specifieker. Vage instructies ("gebruik componenten wanneer nuttig") werken minder goed dan expliciete triggers ("gebruik TrackingCard wanneer de gebruiker een barcode noemt").

---

## Referentie — Beschikbare Stamp-componenten

Importeer uit `@design-system/react`:

| Component | Props | Gebruik |
|---|---|---|
| `Heading` | `level={1-6}`, `size="s/m/l/xl"` | Titels en sectieopschriften |
| `Text` | `size="s/m/l"`, `variant="default/subtle"` | Lopende tekst |
| `LabelBasic` | _(children)_ | Neutraal status-label |
| `LabelEmphasis` | _(children)_ | Benadrukt badge (bijv. 'Aangeraden') |
| `Button` | `variant="primary/secondary/tertiary"` | Acties en bevestigingen |

Gebruik `includeBasicCatalog: true` in `catalog.ts` om ook A2UI-primitieven beschikbaar te maken.

---

*PostNL Hackathon 2026 — Veel succes!*
