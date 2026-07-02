import type { ShippingAddress } from "@/lib/telegram/order-state";

export interface OrderLineItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
  currency: string;
}

export interface CompletedOrderRecord {
  orderId: string;
  completedAt: string;
  items: OrderLineItem[];
  shippingAddress: ShippingAddress | null;
  subtotal: number | null;
  currency: string;
}

interface CartSnapshot {
  items: OrderLineItem[];
  shippingAddress: ShippingAddress | null;
  subtotal: number | null;
  currency: string;
}

const lastOrders = new Map<number, CompletedOrderRecord>();
const cartSnapshots = new Map<number, CartSnapshot>();

export function saveCartSnapshot(
  chatId: number,
  snapshot: CartSnapshot
): void {
  cartSnapshots.set(chatId, snapshot);
}

export function getCartSnapshot(chatId: number): CartSnapshot | null {
  return cartSnapshots.get(chatId) ?? null;
}

export function saveLastOrder(
  chatId: number,
  order: CompletedOrderRecord
): void {
  lastOrders.set(chatId, order);
}

export function getLastOrder(chatId: number): CompletedOrderRecord | null {
  return lastOrders.get(chatId) ?? null;
}

export function finalizeLastOrder(
  chatId: number,
  orderId: string,
  stateItems: OrderLineItem[],
  stateShippingAddress: ShippingAddress | null,
  stateSubtotal: number | null
): void {
  const snapshot = getCartSnapshot(chatId);
  const items = stateItems.length > 0 ? stateItems : (snapshot?.items ?? []);

  if (items.length === 0) {
    return;
  }

  saveLastOrder(chatId, {
    orderId,
    completedAt: new Date().toISOString(),
    items,
    shippingAddress: stateShippingAddress ?? snapshot?.shippingAddress ?? null,
    subtotal: stateSubtotal ?? snapshot?.subtotal ?? null,
    currency: snapshot?.currency ?? "EUR",
  });
}

export function clearLastOrder(chatId: number): void {
  lastOrders.delete(chatId);
  cartSnapshots.delete(chatId);
}
