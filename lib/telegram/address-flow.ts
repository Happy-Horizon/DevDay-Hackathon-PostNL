import type { InlineKeyboardMarkup } from "./types";
import {
  formatShippingAddress,
  getOrderState,
  setOrderState,
  type ShippingAddress,
} from "./order-state";

export function addressConfirmKeyboard(): InlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { text: "Ja, dit adres klopt", callback_data: "address_default_yes" },
        { text: "Nee, ander adres", callback_data: "address_default_no" },
      ],
    ],
  };
}

export const CUSTOM_ADDRESS_PROMPT = `Geef je gewenste bezorgadres op:

Straat + huisnummer, postcode en plaats — bijvoorbeeld:
Kerkstraat 10, 3511AB Utrecht`;

export function buildAddressConfirmMessage(address: ShippingAddress): string {
  const formatted = formatShippingAddress(address);
  const source = address.isDefaultFromPostnl
    ? "standaardadres uit je PostNL-account"
    : "aangepast bezorgadres";

  return `Bezorgadres (${source}):\n${formatted}\n\nKlopt dit adres voor je bestelling?`;
}

export function parseAddressLine(text: string): ShippingAddress | null {
  const trimmed = text.trim();
  if (trimmed.length < 8) return null;

  const match = trimmed.match(/^(.+?),\s*(\d{4}\s?[A-Za-z]{2})\s+(.+)$/);

  if (match) {
    const [, street, postalCode, city] = match;
    return {
      label: trimmed,
      street: street.trim(),
      postalCode: postalCode.replace(/\s/g, "").toUpperCase(),
      city: city.trim(),
      isDefaultFromPostnl: false,
    };
  }

  return {
    label: trimmed,
    isDefaultFromPostnl: false,
  };
}

export function startCustomAddressFlow(chatId: number): { message: string } {
  setOrderState(chatId, { phase: "awaiting_custom_address" });
  return { message: CUSTOM_ADDRESS_PROMPT };
}

export function confirmDefaultAddress(
  chatId: number,
  useDefault: boolean
): { message: string } {
  const state = getOrderState(chatId);

  if (useDefault && state.shippingAddress) {
    setOrderState(chatId, { phase: "address_confirmed" });
    return {
      message:
        `Bezorgadres bevestigd:\n${formatShippingAddress(state.shippingAddress)}`,
    };
  }

  return startCustomAddressFlow(chatId);
}

export function recordCustomAddress(
  chatId: number,
  text: string
): { message: string } | { error: string } {
  const state = getOrderState(chatId);
  if (state.phase !== "awaiting_custom_address") {
    return { error: "Geen actieve adresstap voor een nieuw adres." };
  }

  const address = parseAddressLine(text);
  if (!address) {
    return {
      error: "Ik kon dat adres niet lezen. Gebruik: Straat 1, 1234AB Plaats",
    };
  }

  setOrderState(chatId, {
    phase: "address_confirmed",
    postnlSignedIn: state.postnlSignedIn ?? true,
    shippingAddress: address,
  });

  return {
    message: `Bezorgadres bijgewerkt:\n${formatShippingAddress(address)}`,
  };
}

export function applyAlternateShippingAddress(
  chatId: number,
  text: string
): { message: string } | { error: string } {
  const address = parseAddressLine(text);
  if (!address) {
    return {
      error: "Ik kon dat adres niet lezen. Gebruik: Straat 1, 1234AB Plaats",
    };
  }

  const state = getOrderState(chatId);
  setOrderState(chatId, {
    phase: "address_confirmed",
    postnlSignedIn: state.postnlSignedIn ?? true,
    shippingAddress: address,
  });

  return {
    message: `Bezorgadres bijgewerkt:\n${formatShippingAddress(address)}`,
  };
}
