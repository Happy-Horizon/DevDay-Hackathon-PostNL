import { defineTool } from "@copilotkit/runtime/v2";
import { z } from "zod";
import { commerceActions } from "./actions";

export const commerceTools = [
  defineTool({
    name: "init_magento_session",
    description:
      "Start een nieuwe Magento-sessie (PHPSESSID + form_key). Roep dit aan vóór de eerste cart-actie, of opnieuw als de sessie verlopen is.",
    parameters: z.object({}),
    execute: async () => commerceActions.initMagentoSession(),
  }),

  defineTool({
    name: "search_products",
    description:
      "Zoek SimpleProducts in de Magento-catalogus op trefwoord. Retourneert maximaal 10 eenvoudige producten met SKU, naam en prijs. Gebruik alleen SimpleProduct-resultaten.",
    parameters: z.object({
      searchTerm: z
        .string()
        .describe("Zoekterm, bijv. 'kaars', 'yoga', 'cadeau'"),
    }),
    execute: async ({ searchTerm }) =>
      commerceActions.searchProducts(searchTerm),
  }),

  defineTool({
    name: "add_to_cart",
    description:
      "Voeg een SimpleProduct toe aan de sessie-gebaseerde Magento-winkelwagen. Gebruik NIET GraphQL addSimpleProductsToCart. Hoeveelheid wordt automatisch verhoogd tot minimaal €5,00 indien nodig.",
    parameters: z.object({
      sku: z.string().describe("SKU van het gekozen product"),
      quantity: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Aantal stuks; laat leeg voor automatische berekening (min. €5)"),
    }),
    execute: async ({ sku, quantity }) =>
      commerceActions.addToCart(sku, quantity),
  }),

  defineTool({
    name: "estimate_delivery",
    description:
      "Schat de bezorgdatum op basis van postcode en optioneel plaats. Gebruik dit nadat de gebruiker een bezorgadres heeft gegeven.",
    parameters: z.object({
      postalCode: z.string().describe("Nederlandse postcode, bijv. 1012AB"),
      city: z.string().optional().describe("Plaatsnaam"),
    }),
    execute: async ({ postalCode, city }) =>
      commerceActions.estimateDelivery(postalCode, city),
  }),

  defineTool({
    name: "init_postnl_checkout",
    description:
      "Start PostNL Fast Checkout en ontvang orderId + deeplink URL. Roep dit ALLEEN aan nadat de gebruiker expliciet akkoord is gegaan met de ordersamenvatting. De gebruiker moet zelf betalen via de PostNL-app.",
    parameters: z.object({
      userConfirmed: z
        .boolean()
        .describe(
          "true alleen als de gebruiker expliciet ja/akkoord/bevestigen heeft gezegd"
        ),
    }),
    execute: async ({ userConfirmed }) =>
      commerceActions.initPostnlCheckout(userConfirmed),
  }),
];
