import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { COMMERCE_AGENT_PROMPT } from "@/lib/agent/prompt";
import { syncGoogleApiKeyEnv } from "@/lib/env";
import { commerceTools } from "@/lib/magento/tools";

const googleApiKey = syncGoogleApiKeyEnv();

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "google/gemini-2.5-flash",
      apiKey: googleApiKey,
      prompt: COMMERCE_AGENT_PROMPT,
      tools: commerceTools,
      maxSteps: 10,
    }),
  },
  a2ui: { injectA2UITool: true },
});

export const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});
