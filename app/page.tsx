"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Heading } from "@design-system/react";
import { useAgent, useCopilotKit } from "@copilotkit/react-core/v2";
import { Header } from "@/components/chat/Header";
import { Footer } from "@/components/chat/Footer";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { CategoryGrid } from "@/components/chat/CategoryGrid";
import { CategoryPrompts } from "@/components/chat/CategoryPrompts";

type Phase =
  | { name: "landing" }
  | { name: "category"; categoryId: string }
  | { name: "chat"; initialMessage: string };

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Goedemorgen";
  if (hour < 18) return "Goedemiddag";
  return "Goedenavond";
}

function InitialMessageSender({ initialMessage }: { initialMessage: string }) {
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: initialMessage,
    });

    void copilotkit.runAgent({ agent });
  }, [agent, copilotkit, initialMessage]);

  return null;
}

function ChatPhase({
  initialMessage,
  onCancel,
}: {
  initialMessage: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-white">
      <Header onCancel={onCancel} />
      <ChatInterface />
      <InitialMessageSender initialMessage={initialMessage} />
      <Footer />
    </div>
  );
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>({ name: "landing" });
  const [inputValue, setInputValue] = useState("");

  const handleCancel = useCallback(() => {
    setPhase({ name: "landing" });
    setInputValue("");
  }, []);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    setInputValue("");
    setPhase({ name: "chat", initialMessage: text });
  }, []);

  if (phase.name === "chat") {
    return (
      <ChatPhase
        key={phase.initialMessage}
        initialMessage={phase.initialMessage}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1">
      <Header onCancel={handleCancel} />

      <main className="flex-1 flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-2xl">
          <Heading level={1} size="xl" className="mb-8">
            {getGreeting()}, wat wil je versturen?
          </Heading>

          <ChatComposer
            value={inputValue}
            onChange={setInputValue}
            onSubmit={sendMessage}
            isLoading={false}
          />

          {phase.name === "landing" ? (
            <CategoryGrid
              onSelect={(categoryId) =>
                setPhase({ name: "category", categoryId })
              }
            />
          ) : (
            <CategoryPrompts
              categoryId={phase.categoryId}
              onBack={() => setPhase({ name: "landing" })}
              onSelect={sendMessage}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
