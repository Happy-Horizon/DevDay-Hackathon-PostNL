/**
 * PostNL Fast Checkout deeplink helpers.
 * When address is pre-confirmed on the Magento order, append payment step query.
 */
export function buildPostnlCheckoutUrl(
  checkoutUrl: string,
  options?: { skipToPayment?: boolean }
): string {
  if (!options?.skipToPayment) {
    return checkoutUrl;
  }

  const paymentQuery =
    process.env.POSTNL_CHECKOUT_PAYMENT_QUERY?.trim() || "step=payment";

  try {
    const url = new URL(checkoutUrl);
    for (const part of paymentQuery.split("&")) {
      const [key, value] = part.split("=");
      if (key) {
        url.searchParams.set(key, value ?? "true");
      }
    }
    return url.toString();
  } catch {
    const separator = checkoutUrl.includes("?") ? "&" : "?";
    return `${checkoutUrl}${separator}${paymentQuery}`;
  }
}
