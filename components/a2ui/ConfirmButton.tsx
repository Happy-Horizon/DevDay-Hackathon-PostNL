"use client";

import { useState } from "react";
import { Heading, Text } from "@design-system/react";
import { useAgentReply } from "@/lib/a2ui/use-agent-reply";

export interface ConfirmButtonProps {
  suggestion: string;
  title?: string;
  confirmLabel?: string;
  confirmMessage?: string;
  declineLabel?: string;
  declineMessage?: string;
  showDecline?: boolean;
}

const actionButtonBase =
  "inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6161ff]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const confirmButtonClass = `${actionButtonBase} bg-[#6161ff] text-white hover:bg-[#5050e6] active:bg-[#4545d4]`;
const declineButtonClass = `${actionButtonBase} border border-gray-300 bg-white text-gray-800 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100`;

export function ConfirmButton({
  suggestion,
  title = "Klopt dit?",
  confirmLabel = "Bevestigen",
  confirmMessage,
  declineLabel = "Afwijzen",
  declineMessage,
  showDecline = true,
}: ConfirmButtonProps) {
  const { sendReply, isDisabled } = useAgentReply();
  const [submittedAction, setSubmittedAction] = useState<
    "confirm" | "decline" | null
  >(null);

  function handleConfirm() {
    if (!sendReply(confirmMessage ?? `Ja, ${suggestion}`)) return;
    setSubmittedAction("confirm");
  }

  function handleDecline() {
    if (!sendReply(declineMessage ?? `Nee, ${suggestion}`)) return;
    setSubmittedAction("decline");
  }

  const confirmText =
    submittedAction === "confirm" ? "Bevestigd" : confirmLabel;
  const declineText =
    submittedAction === "decline" ? "Afgewezen" : declineLabel;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4 shadow-sm w-full">
      <Heading level={3} size="s">
        {title}
      </Heading>
      <Text size="s">{suggestion}</Text>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {showDecline && (
          <button
            type="button"
            disabled={isDisabled}
            onClick={handleDecline}
            className={`${declineButtonClass} sm:flex-1`}
          >
            {declineText}
          </button>
        )}
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleConfirm}
          className={`${confirmButtonClass}${showDecline ? " sm:flex-1" : ""}`}
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
}
