import type { SearchProductOption } from "./order-state";
import { getOrderState } from "./order-state";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Magento-style SKU, e.g. 24-WG087 */
function looksLikeMagentoSku(value: string): boolean {
  return /^[A-Z0-9][A-Z0-9._-]*$/i.test(value);
}

/**
 * Resolve user/agent input to a real SKU from the last search results.
 * Handles list index ("2"), exact SKU, and common LLM slug mistakes.
 */
export function resolveProductSku(
  chatId: number,
  input: string
): string | null {
  const products = getOrderState(chatId).lastSearchProducts;
  if (!products?.length) {
    return looksLikeMagentoSku(input.trim()) ? input.trim() : null;
  }

  const trimmed = input.trim();

  if (/^\d+$/.test(trimmed)) {
    const index = parseInt(trimmed, 10);
    return products.find((p) => p.index === index)?.sku ?? null;
  }

  const exactSku = products.find(
    (p) => p.sku.toLowerCase() === trimmed.toLowerCase()
  );
  if (exactSku) return exactSku.sku;

  const inputSlug = slugify(trimmed);
  const byNameSlug = products.find((p) => slugify(p.name) === inputSlug);
  if (byNameSlug) return byNameSlug.sku;

  const byPartialName = products.find((p) => {
    const nameSlug = slugify(p.name);
    return nameSlug.includes(inputSlug) || inputSlug.includes(nameSlug);
  });
  if (byPartialName) return byPartialName.sku;

  if (looksLikeMagentoSku(trimmed)) {
    return trimmed;
  }

  return null;
}

export function formatSearchResultsList(products: SearchProductOption[]): string {
  return products
    .map(
      (p) =>
        `${p.index}. ${p.name} — €${p.price.toFixed(2)} (SKU: ${p.sku})`
    )
    .join("\n");
}

export function isProductIndexSelection(text: string): boolean {
  return /^\d+$/.test(text.trim());
}
