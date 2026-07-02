import { z } from "zod";
import type { CatalogDefinitions } from "@copilotkit/a2ui-renderer";

export const stampDefinitions = {
  ProductCard: {
    description:
      "A product option card for the Magento catalog. Use when presenting 1–3 SimpleProduct options after a search. " +
      "Show name, SKU, price, and optional index number. Do NOT use for order confirmation or checkout.",
    props: z.object({
      index: z.number().optional().describe("Option number (1, 2, 3)"),
      name: z.string().describe("Product name"),
      sku: z.string().describe("Product SKU"),
      price: z.string().describe("Formatted price, e.g. '€12,95'"),
      note: z.string().optional().describe("Short note, e.g. min. quantity for €5 cart"),
    }),
  },

  OrderSummary: {
    description:
      "Order summary shown BEFORE checkout, for user confirmation. " +
      "Use when the user has chosen a product and provided delivery details. " +
      "Requires explicit user approval before calling init_postnl_checkout.",
    props: z.object({
      productName: z.string(),
      sku: z.string(),
      quantity: z.number(),
      subtotal: z.string().describe("Formatted subtotal, e.g. '€24,90'"),
      deliveryAddress: z.string(),
      deliveryDate: z.string().optional(),
      deliveryService: z.string().optional(),
    }),
  },

  CheckoutHandoff: {
    description:
      "PostNL Fast Checkout handoff card shown AFTER init_postnl_checkout succeeds. " +
      "Contains orderId and checkoutUrl deeplink. User completes payment in PostNL app.",
    props: z.object({
      orderId: z.string().describe("PNL-xxxxxxxx order reference"),
      checkoutUrl: z.string().describe("Deeplink URL for PostNL app checkout"),
      message: z
        .string()
        .optional()
        .describe("Short Dutch instruction for the user"),
    }),
  },

  PriceRow: {
    description:
      "One line in a price breakdown: label and formatted euro amount. Use multiple PriceRows for order totals.",
    props: z.object({
      label: z.string(),
      amount: z.string(),
      isTotal: z.boolean().optional(),
    }),
  },

  ServiceCard: {
    description:
      "A delivery or shipping service option. Use when presenting PostNL delivery choices (e.g. Standaard vs Vandaag).",
    props: z.object({
      name: z.string(),
      description: z.string(),
      price: z.string(),
      badge: z.string().optional(),
    }),
  },
} satisfies CatalogDefinitions;

export type StampDefinitions = typeof stampDefinitions;
