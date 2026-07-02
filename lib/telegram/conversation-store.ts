import type { ModelMessage } from "ai";
import { clearActiveSession } from "@/lib/magento/session-store";
import { finalizeLastOrder } from "./order-history";
import { clearOrderState, getOrderState } from "./order-state";

const MAX_MESSAGES = 24;

const conversations = new Map<number, ModelMessage[]>();
const completedOrders = new Set<number>();

export function getConversation(chatId: number): ModelMessage[] {
  return conversations.get(chatId) ?? [];
}

export function setConversation(
  chatId: number,
  messages: ModelMessage[]
): void {
  conversations.set(chatId, messages.slice(-MAX_MESSAGES));
}

export function clearConversation(chatId: number): void {
  conversations.delete(chatId);
}

export function telegramSessionScope(chatId: number): string {
  return `telegram:${chatId}`;
}

export function resetTelegramChatSession(chatId: number): void {
  clearConversation(chatId);
  clearActiveSession(telegramSessionScope(chatId));
  clearOrderState(chatId);
  completedOrders.delete(chatId);
}

/** Call after checkout link is sent — next user message starts a fresh order. */
export function markOrderCompleted(chatId: number, orderId?: string): void {
  if (orderId) {
    const state = getOrderState(chatId);
    finalizeLastOrder(
      chatId,
      orderId,
      state.cartItems,
      state.shippingAddress,
      state.cartTotal
    );
  }

  clearConversation(chatId);
  clearActiveSession(telegramSessionScope(chatId));
  clearOrderState(chatId);
  completedOrders.add(chatId);
}

export function beginNewOrderIfNeeded(chatId: number): boolean {
  if (!completedOrders.has(chatId)) return false;
  completedOrders.delete(chatId);
  clearConversation(chatId);
  clearActiveSession(telegramSessionScope(chatId));
  clearOrderState(chatId);
  return true;
}

export function hasCompletedOrder(chatId: number): boolean {
  return completedOrders.has(chatId);
}
