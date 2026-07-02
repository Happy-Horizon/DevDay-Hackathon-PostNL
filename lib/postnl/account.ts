import { parseAddressLine } from "@/lib/telegram/address-flow";
import type { ShippingAddress } from "@/lib/telegram/order-state";

export interface PostnlAccountProfile {
  telegramChatId?: number;
  telegramUserId?: number;
  defaultAddress: string;
  accountLabel?: string;
  /** Optional token for future live PostNL session verification */
  postnlSessionToken?: string;
}

export type PostnlAccountSource = "linked-profile" | "verified-session" | "none";

export interface PostnlAccountStatus {
  signedIn: boolean;
  defaultAddress: ShippingAddress | null;
  source: PostnlAccountSource;
  accountLabel?: string;
}

function loadPostnlProfiles(): PostnlAccountProfile[] {
  const raw = process.env.POSTNL_ACCOUNT_PROFILES?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as PostnlAccountProfile[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      console.warn(
        "[postnl] POSTNL_ACCOUNT_PROFILES is invalid JSON — skipping profiles."
      );
    }
  }

  const defaultAddress = process.env.POSTNL_DEFAULT_ADDRESS?.trim();
  const linkedIds = process.env.POSTNL_LINKED_TELEGRAM_CHAT_IDS?.split(",")
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id));

  if (defaultAddress && linkedIds?.length) {
    return linkedIds.map((telegramChatId) => ({
      telegramChatId,
      defaultAddress,
    }));
  }

  return [];
}

function findProfile(
  chatId: number,
  userId?: number
): PostnlAccountProfile | null {
  const profiles = loadPostnlProfiles();
  if (profiles.length === 0) return null;

  return (
    profiles.find(
      (profile) =>
        profile.telegramChatId === chatId ||
        (userId !== undefined && profile.telegramUserId === userId)
    ) ?? null
  );
}

/**
 * Resolves PostNL sign-in + default address for a Telegram user (silent, no chat).
 * Linked env profiles represent a verified PostNL account for hackathon/demo.
 */
export async function checkPostnlAccount(
  chatId: number,
  userId?: number
): Promise<PostnlAccountStatus> {
  const profile = findProfile(chatId, userId);

  if (!profile?.defaultAddress) {
    return {
      signedIn: false,
      defaultAddress: null,
      source: "none",
    };
  }

  if (profile.postnlSessionToken) {
    const verifyUrl = process.env.POSTNL_SESSION_VERIFY_URL?.trim();
    if (verifyUrl) {
      try {
        const response = await fetch(verifyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: profile.postnlSessionToken }),
        });
        if (!response.ok) {
          return {
            signedIn: false,
            defaultAddress: null,
            source: "none",
          };
        }
      } catch {
        console.warn("[postnl] Session verify failed — treating as signed out.");
        return {
          signedIn: false,
          defaultAddress: null,
          source: "none",
        };
      }
    }
  }

  const parsed = parseAddressLine(profile.defaultAddress);
  if (!parsed?.street || !parsed.postalCode || !parsed.city) {
    console.warn(
      `[postnl] Invalid defaultAddress for chat ${chatId}: ${profile.defaultAddress}`
    );
    return {
      signedIn: false,
      defaultAddress: null,
      source: "none",
    };
  }

  return {
    signedIn: true,
    defaultAddress: {
      ...parsed,
      isDefaultFromPostnl: true,
    },
    source: profile.postnlSessionToken ? "verified-session" : "linked-profile",
    accountLabel: profile.accountLabel,
  };
}
