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

  PriceRow: {
    description:
      "One line in a shipping price breakdown: a label and a formatted euro amount. Use multiple PriceRows inside a Column to build a price table. Mark the total row with isTotal.",
    props: z.object({
      label: z.string(),
      amount: z.string(),
      isTotal: z.boolean().optional(),
    }),
  },

  ServiceCard: {
    description:
      "A PostNL shipping service option with name, short description, price, and optional badge (e.g. 'Aangeraden', 'Snel'). Use when presenting shipping options to choose from.",
    props: z.object({
      name: z.string(),
      description: z.string(),
      price: z.string(),
      badge: z.string().optional(),
    }),
  },

  RadioButtonGroup: {
    description:
      "Interactive single-choice selector with radio buttons. " +
      "Use whenever the user must pick one option from a list (e.g. parcel weight, delivery speed, package size, pickup vs home delivery). " +
      "Provide a clear title, optional helper text, and 2–6 options with a replyMessage per option so the user's choice is sent back to the agent. " +
      "Do NOT use for yes/no confirmation (use ConfirmButton), tracking, or read-only info.",
    props: z.object({
      title: z
        .string()
        .describe("Card heading, e.g. 'Pakketgewicht' or 'Bezorgoptie'"),
      description: z
        .string()
        .optional()
        .describe("Optional helper text shown below the title"),
      selectedValue: z
        .string()
        .optional()
        .describe("Pre-selected option value when a choice is already known"),
      options: z
        .array(
          z.object({
            value: z.string().describe("Unique option id"),
            label: z.string().describe("Display label for the option"),
            description: z
              .string()
              .optional()
              .describe("Optional subtext or extra detail for the option"),
            suggestions: z
              .array(z.string())
              .optional()
              .describe(
                "Optional example items shown as 'Past bij o.a. …' (e.g. everyday items for a weight tier)",
              ),
            replyMessage: z
              .string()
              .describe(
                "Dutch user message sent when this option is selected, e.g. 'Het pakket weegt tot 2 kg.'",
              ),
          }),
        )
        .min(2)
        .describe("List of choices; include replyMessage on each option"),
    }),
  },

  CaseIdentifyer: {
    description:
      "Interactive option selector for the agent to figure out wether the user needs help to figure out the weight classification and type of box for their package, or if they already have one / have their package packed.",
    props: z.object({
      question: z
        .string()
        .describe(
          "The agent questions wether the user already has their package packed or already has a box, or if the user needs help figuring out the type of box and weight class",
        ),
      title: z
        .string()
        .optional()
        .describe("Card heading, default 'Klopt dit?'"),
      packedLabel: z
        .string()
        .optional()
        .describe(
          "already packed button label, default 'Ik heb al een pakket/doos'",
        ),
      packedMessage: z
        .string()
        .optional()
        .describe(
          "User message sent when already packed; defaults to 'Ik heb al een pakket/doos' if omitted",
        ),
      needHelpLabel: z
        .string()
        .optional()
        .describe("need help button label, default 'Pakket hulp'"),
      needHelpMessage: z
        .string()
        .optional()
        .describe(
          "User message sent on need help; defaults to 'Ik heb hulp nodig met het samenstellen van de informatie voor mijn pakket.",
        ),
    }),
  },
  ConfirmButton: {
    description:
      "Interactive yes/no confirmation for the user to approve or reject an agent suggestion " +
      "(e.g. recommended service, weight estimate, delivery option, or price summary). " +
      "Use after presenting a recommendation and before moving to the next step. " +
      "Do NOT use for tracking info or the final order-complete screen.",
    props: z.object({
      suggestion: z
        .string()
        .describe(
          "Short Dutch summary of what the agent suggests, shown above the buttons",
        ),
      title: z
        .string()
        .optional()
        .describe("Card heading, default 'Klopt dit?'"),
      confirmLabel: z
        .string()
        .optional()
        .describe("Confirm button label, default 'Bevestigen'"),
      confirmMessage: z
        .string()
        .optional()
        .describe(
          "User message sent on confirm; defaults to 'Ja, {suggestion}' if omitted",
        ),
      declineLabel: z
        .string()
        .optional()
        .describe("Decline button label, default 'Afwijzen'"),
      declineMessage: z
        .string()
        .optional()
        .describe(
          "User message sent on decline; defaults to 'Nee, {suggestion}' if omitted",
        ),
      showDecline: z
        .boolean()
        .optional()
        .describe(
          "Show the decline button; default true. Set false for confirm-only.",
        ),
    }),
  },
} satisfies CatalogDefinitions;

export type StampDefinitions = typeof stampDefinitions;
