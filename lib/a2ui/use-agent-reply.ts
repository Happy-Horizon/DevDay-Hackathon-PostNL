"use client";

import { useState } from "react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

export function useAgentReply() {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const isRunning =
    (agent as unknown as { isRunning?: boolean }).isRunning ?? false;
  const [hasSubmitted, setHasSubmitted] = useState(false);

  function sendReply(content: string): boolean {
    if (isRunning || hasSubmitted) return false;

    setHasSubmitted(true);
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content,
    });
    void copilotkit.runAgent({ agent });
    return true;
  }

  return {
    sendReply,
    isDisabled: isRunning || hasSubmitted,
    hasSubmitted,
    isRunning,
  };
}
