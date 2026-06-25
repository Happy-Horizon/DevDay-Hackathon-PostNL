import {
  CopilotRuntime,
  BuiltInAgent,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: "google/gemini-2.5-flash",
      apiKey:
        process.env.GOOGLE_API_KEY ??
        process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      prompt:
        "Je bent een behulpzame PostNL-assistent. Je helpt klanten met vragen over verzenden, ontvangen, tracking, tarieven en andere PostNL-diensten. Gebruik de beschikbare UI-componenten wanneer dit de gebruiker helpt (bijv. een TrackingCard voor pakketstatus, ServiceCard voor verzendopties, PriceRow voor tarieven). Antwoord altijd in het Nederlands, bondig en vriendelijk.",
    }),
  },
  a2ui: {},
});

export const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});
