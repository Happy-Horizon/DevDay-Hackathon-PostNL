import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SKILL_RELATIVE_PATH =
  ".cursor/skills/postnl-fast-checkout/SKILL.md";

const SKILL_TOOL_MAPPING = `
## Skill → tools (gebruik ALTIJD tools, nooit curl)

| Skill stap | Actie | Tool |
|------------|-------|------|
| 1–2 | PHPSESSID + form_key ophalen | init_magento_session |
| 3 | Producten zoeken (alleen SimpleProduct) | search_products |
| 4 | Quantity voor min. €5 berekenen | add_to_cart (auto) |
| 5–6 | Sessie-cart vullen (NIET GraphQL cart) | add_to_cart |
| 7 | PostNL Fast Checkout init | init_postnl_checkout |
| 8 | Deeplink doorgeven aan gebruiker | checkoutUrl in Telegram |

## Foutafhandeling (uit skill)
- Minimum amount is 5 → verhoog quantity, opnieuw add_to_cart + init
- EMPTY_CART → sessie-cart gebruiken; nooit GraphQL addSimpleProductsToCart
- 404 op init → init_magento_session en flow herhalen
- Lege braintree_masked_id → eerst add_to_cart, daarna opnieuw init
`.trim();

const FALLBACK_SKILL = `
# PostNL Fast Checkout (samenvatting)

Magento store: magento-acc.pricetracking.net
Minimale winkelwagenwaarde: €5,00
Alleen SimpleProducts. Sessie-cart via POST /checkout/cart/add/, niet GraphQL.
PostNL init retourneert orderId (PNL-xxx) en checkoutUrl deeplink.
Gebruiker rondt adres en betaling af in PostNL-app.
`.trim();

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---[\s\S]*?---\s*/, "").trim();
}

/** Remove bash blocks — the bot executes via typed tools, not shell curl. */
function stripBashBlocks(markdown: string): string {
  return markdown
    .replace(/```bash[\s\S]*?```/g, "_[uitgevoerd via commerce tools — zie mapping]_")
    .trim();
}

export function getPostnlFastCheckoutSkillPath(): string {
  return join(process.cwd(), SKILL_RELATIVE_PATH);
}

export function loadPostnlFastCheckoutSkill(): string {
  const skillPath = getPostnlFastCheckoutSkillPath();

  if (!existsSync(skillPath)) {
    return `${FALLBACK_SKILL}\n\n${SKILL_TOOL_MAPPING}`;
  }

  const raw = readFileSync(skillPath, "utf8");
  const body = stripBashBlocks(stripFrontmatter(raw));

  return `${body}\n\n---\n\n${SKILL_TOOL_MAPPING}`;
}

export const POSTNL_FAST_CHECKOUT_SKILL_NAME = "postnl-fast-checkout";
