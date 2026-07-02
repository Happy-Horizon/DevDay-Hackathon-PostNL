import { checkPostnlAccount } from "@/lib/postnl/account";
import { logAgentEvent } from "@/lib/logging/agent-logger";
import { setOrderState } from "./order-state";

export interface BackgroundPostnlCheckResult {
  signedIn: boolean;
  addressApplied: boolean;
  addressLabel: string | null;
}

/**
 * Silent PostNL account lookup after cart add.
 * Linked users get their default address applied without chat prompts.
 */
export async function applyBackgroundPostnlCheck(
  chatId: number,
  userId?: number
): Promise<BackgroundPostnlCheckResult> {
  const status = await checkPostnlAccount(chatId, userId);

  logAgentEvent({
    timestamp: new Date().toISOString(),
    channel: "commerce",
    sessionScope: `telegram:${chatId}`,
    chatId,
    userId,
    meta: {
      event: "postnl_background_check",
      signedIn: status.signedIn,
      source: status.source,
      accountLabel: status.accountLabel ?? null,
      address: status.defaultAddress?.label ?? null,
    },
  });

  if (status.signedIn && status.defaultAddress) {
    setOrderState(chatId, {
      phase: "address_confirmed",
      postnlSignedIn: true,
      postnlCheckDone: true,
      defaultAddressLabel: status.defaultAddress.label,
      shippingAddress: status.defaultAddress,
    });

    return {
      signedIn: true,
      addressApplied: true,
      addressLabel: status.defaultAddress.label,
    };
  }

  setOrderState(chatId, {
    phase: "address_confirmed",
    postnlSignedIn: false,
    postnlCheckDone: true,
    defaultAddressLabel: null,
    shippingAddress: null,
  });

  return {
    signedIn: false,
    addressApplied: false,
    addressLabel: null,
  };
}
