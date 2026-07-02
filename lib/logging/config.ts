export function isAgentLoggingEnabled(): boolean {
  const value = process.env.AGENT_LOGGING_ENABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export function getAgentLogFilePath(): string | undefined {
  if (!isAgentLoggingEnabled()) return undefined;
  return process.env.AGENT_LOG_FILE?.trim() || "logs/agent.ndjson";
}
