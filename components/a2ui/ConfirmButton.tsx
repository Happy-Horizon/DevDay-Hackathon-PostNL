"use client";

import { useState } from "react";
import { Button, Heading, Text } from "@design-system/react";
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
          <Button
            type="button"
            variant="secondary"
            size="full"
            disabled={isDisabled}
            onClick={handleDecline}
            className="sm:flex-1"
          >
            {declineText}
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          size="full"
          disabled={isDisabled}
          onClick={handleConfirm}
          className={showDecline ? "sm:flex-1" : undefined}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
}
