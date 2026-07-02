import { AsyncLocalStorage } from "async_hooks";
import type { MagentoSession } from "./types";

const DEFAULT_SCOPE = "default";
const sessionScope = new AsyncLocalStorage<string>();
const sessions = new Map<string, MagentoSession>();

function resolveScope(scope?: string): string {
  return scope ?? sessionScope.getStore() ?? DEFAULT_SCOPE;
}

export function runWithSessionScope<T>(
  scope: string,
  fn: () => Promise<T>
): Promise<T> {
  return sessionScope.run(scope, fn);
}

export function getActiveSession(scope?: string): MagentoSession | null {
  return sessions.get(resolveScope(scope)) ?? null;
}

export function setActiveSession(
  session: MagentoSession,
  scope?: string
): void {
  sessions.set(resolveScope(scope), session);
}

export function clearActiveSession(scope?: string): void {
  sessions.delete(resolveScope(scope));
}
