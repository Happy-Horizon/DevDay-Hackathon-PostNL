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
} satisfies CatalogDefinitions;

export type StampDefinitions = typeof stampDefinitions;
