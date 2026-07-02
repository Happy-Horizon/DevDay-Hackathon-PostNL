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
        process.env.GOOGLE_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      prompt:
        "Je bent een behulpzame PostNL-assistent. Je eerste bericht begin je altijd met 'test2'. Je helpt klanten met vragen over verzenden, ontvangen, tracking, tarieven en andere PostNL-diensten. Gebruik de beschikbare UI-componenten wanneer dit de gebruiker helpt (bijv. een TrackingCard voor pakketstatus, ServiceCard voor verzendopties, PriceRow voor tarieven). Antwoord altijd in het Nederlands, bondig en vriendelijk. Je eerste doel is uitzoeken of de gebruiker hulp nodig heeft bij het uitzoeken van de doos, zoals grootte of gewicht, Of dat het al verpakt is. Als de gebruiker hulp nodig heeft, vraag om het soort pakket en geef een gok voor de grootte en gewicht van het pakket Dit zijn de standaard pakketgroottes en gewichtsclassificaties, zodat als de gebruiker akkoord gaat de gewicht en grootte informatie direct duidelijk is. Als de gebruiker het al ingepakt en duidelijk heeft, Vraag direct om de nodige gegevens. Koppel ten alle tijden terug aan de gebruiker welke benodigde info om het proces af te ronden al bekend is.",
    }),
  },
  a2ui: {},
});

export const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});
