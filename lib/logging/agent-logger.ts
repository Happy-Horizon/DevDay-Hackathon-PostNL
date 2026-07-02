import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { getAgentLogFilePath, isAgentLoggingEnabled } from "./config";

export interface AgentTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  reasoningTokens?: number;
  cachedInputTokens?: number;
}

export interface AgentToolLogEntry {
  toolName: string;
  input?: unknown;
  output?: unknown;
}

export interface AgentLogEntry {
  timestamp: string;
  channel: "telegram" | "web" | "commerce";
  sessionScope: string;
  chatId?: number;
  userId?: number;
  model?: string;
  request?: string;
  response?: string;
  usage?: AgentTokenUsage;
  tools?: AgentToolLogEntry[];
  durationMs?: number;
  meta?: Record<string, unknown>;
  error?: string;
}

function normalizeUsage(usage: unknown): AgentTokenUsage | undefined {
  if (!usage || typeof usage !== "object") return undefined;

  const u = usage as Record<string, number | undefined>;
  return {
    inputTokens: u.inputTokens ?? u.promptTokens,
    outputTokens: u.outputTokens ?? u.completionTokens,
    totalTokens: u.totalTokens,
    reasoningTokens: u.reasoningTokens,
    cachedInputTokens: u.cachedInputTokens,
  };
}

export function extractUsageFromGenerateResult(result: {
  usage?: unknown;
  totalUsage?: unknown;
}): AgentTokenUsage | undefined {
  return (
    normalizeUsage(result.totalUsage) ??
    normalizeUsage(result.usage) ??
    undefined
  );
}

export function extractToolLogsFromSteps(
  steps: Array<{
    toolCalls?: Array<{ toolName: string; input?: unknown }>;
    toolResults?: Array<{ toolName?: string; output?: unknown }>;
  }> | undefined
): AgentToolLogEntry[] {
  const entries: AgentToolLogEntry[] = [];

  for (const step of steps ?? []) {
    for (const call of step.toolCalls ?? []) {
      const matchingResult = step.toolResults?.find(
        (r) => r.toolName === call.toolName
      );
      entries.push({
        toolName: call.toolName,
        input: call.input,
        output: matchingResult?.output,
      });
    }
  }

  return entries;
}

export function logAgentEvent(entry: AgentLogEntry): void {
  if (!isAgentLoggingEnabled()) return;

  const line = JSON.stringify(entry);
  console.log(`[agent-log] ${line}`);

  const filePath = getAgentLogFilePath();
  if (!filePath) return;

  try {
    mkdirSync(dirname(filePath), { recursive: true });
    appendFileSync(filePath, `${line}\n`, "utf8");
  } catch (error) {
    console.error("[agent-log] Failed to write log file:", error);
  }
}
