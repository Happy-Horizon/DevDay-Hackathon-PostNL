export type AddressFlowPhase =
  | "shopping"
  | "awaiting_custom_address"
  | "address_confirmed";

export interface ShippingAddress {
  label: string;
  street?: string;
  postalCode?: string;
  city?: string;
  isDefaultFromPostnl: boolean;
}

export interface OrderLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface SearchProductOption {
  index: number;
  sku: string;
  name: string;
  price: number;
  currency: string;
}

export interface TelegramOrderState {
  phase: AddressFlowPhase;
  postnlSignedIn: boolean | null;
  postnlCheckDone: boolean;
  defaultAddressLabel: string | null;
  shippingAddress: ShippingAddress | null;
  cartSku: string | null;
  cartTotal: number | null;
  cartItems: OrderLineItem[];
  lastSearchProducts: SearchProductOption[];
}

const orderStates = new Map<number, TelegramOrderState>();

function defaultState(): TelegramOrderState {
  return {
    phase: "shopping",
    postnlSignedIn: null,
    postnlCheckDone: false,
    defaultAddressLabel: null,
    shippingAddress: null,
    cartSku: null,
    cartTotal: null,
    cartItems: [],
    lastSearchProducts: [],
  };
}

export function getOrderState(chatId: number): TelegramOrderState {
  return orderStates.get(chatId) ?? defaultState();
}

export function setOrderState(
  chatId: number,
  patch: Partial<TelegramOrderState>
): TelegramOrderState {
  const next = { ...getOrderState(chatId), ...patch };
  orderStates.set(chatId, next);
  return next;
}

export function clearOrderState(chatId: number): void {
  orderStates.delete(chatId);
}

export function hasCartItems(chatId: number): boolean {
  const state = getOrderState(chatId);
  return state.cartItems.length > 0 || state.cartSku !== null;
}

export function isReadyForCheckout(chatId: number): boolean {
  const state = getOrderState(chatId);

  if (!hasCartItems(chatId)) {
    return false;
  }

  if (state.postnlSignedIn === false) {
    return state.phase === "address_confirmed";
  }

  return (
    state.phase === "address_confirmed" &&
    state.shippingAddress !== null &&
    state.postnlSignedIn === true
  );
}

export function getCheckoutBlockReason(chatId: number): string | null {
  const state = getOrderState(chatId);

  if (!hasCartItems(chatId)) {
    return "Je winkelwagen is leeg. Kies eerst een product of zeg 'opnieuw bestellen'.";
  }

  if (state.postnlSignedIn === null) {
    return "PostNL-account wordt nog op de achtergrond gecontroleerd. Probeer het zo opnieuw.";
  }

  if (state.postnlSignedIn === false) {
    return null;
  }

  if (!state.shippingAddress) {
    return "Bezorgadres ontbreekt op de order.";
  }
  if (state.phase !== "address_confirmed") {
    return "Bezorgadres is nog niet klaar voor checkout.";
  }
  return null;
}

export function shouldApplyShippingToOrder(chatId: number): boolean {
  const state = getOrderState(chatId);
  return state.postnlSignedIn === true && state.shippingAddress !== null;
}

export function formatShippingAddress(address: ShippingAddress): string {
  if (address.street && address.postalCode && address.city) {
    return `${address.street}, ${address.postalCode} ${address.city}`;
  }
  return address.label;
}
