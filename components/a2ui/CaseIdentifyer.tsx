"use client";

import { useState } from "react";
import { Heading, Text } from "@design-system/react";
import { useAgentReply } from "@/lib/a2ui/use-agent-reply";

export interface CaseIdentifyerProps {
  question: string;
  title?: string;
  packedLabel?: string;
  packedMessage?: string;
  needHelpLabel?: string;
  needHelpMessage?: string;
}

const actionButtonBase =
  "inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6161ff]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function CaseIdentifyer({
  question,
  title = "Hulp nodig met de verpakking?",
  packedLabel = "Ik heb al een verpakking",
  packedMessage,
  needHelpLabel = "Ik heb nog geen verpakking",
  needHelpMessage,
}: CaseIdentifyerProps) {
  const { sendReply, isDisabled } = useAgentReply();
  const [submittedAction, setSubmittedAction] = useState<
    "needHelp" | "alreadyPacked" | null
  >(null);

  function handleHelp() {
    if (!sendReply(needHelpMessage ?? `Ik heb nog geen verpakking`)) return;
    setSubmittedAction("needHelp");
  }

  function handlePacked() {
    if (!sendReply(packedMessage ?? `Ik heb al een verpakking`)) return;
    setSubmittedAction("alreadyPacked");
  }

  const packedText =
    submittedAction === "alreadyPacked" ? "Ik heb" : packedLabel;
  const needHelpText =
    submittedAction === "needHelp" ? "Afgewezen" : needHelpLabel;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-4 shadow-sm w-full">
      <Heading level={3} size="s">
        {title}
      </Heading>
      <Text size="s">{question}</Text>
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <button
          type="button"
          disabled={isDisabled}
          onClick={handlePacked}
          className={`${actionButtonBase} sm:flex-1`}
        >
          {packedText}
        </button>
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleHelp}
          className={`${actionButtonBase} sm:flex-1"`}
        >
          {needHelpText}
        </button>
      </div>
    </div>
  );
}
