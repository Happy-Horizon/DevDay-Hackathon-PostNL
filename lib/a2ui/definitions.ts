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

  ShippingAddressForm: {
    description:
      "Interactive form to collect where a package should be shipped: recipient name, address, postcode, and country (when not yet known). " +
      "Use when the user wants to send a package but has not provided a complete delivery address. " +
      "After submit, the form generates a PostNL package sticker. Pass country when the destination country is already known.",
    props: z.object({
      country: z
        .string()
        .optional()
        .describe("Pre-filled destination country, e.g. 'Nederland'. Omit when country is still unknown."),
    }),
  },

  PackageSticker: {
    description:
      "A PostNL shipping label sticker showing recipient name, address, postcode, and country. " +
      "Use after a shipping address is confirmed, or when displaying a generated label. " +
      "Do NOT use before the user has provided a complete address.",
    props: z.object({
      name: z.string().describe("Recipient full name"),
      address: z.string().describe("Street and house number"),
      country: z.string().describe("Destination country"),
      postcode: z.string().describe("Postal code"),
    }),
  },
} satisfies CatalogDefinitions;

export type StampDefinitions = typeof stampDefinitions;
