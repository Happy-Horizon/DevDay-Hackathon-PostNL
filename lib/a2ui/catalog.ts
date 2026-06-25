import { createCatalog } from "@copilotkit/a2ui-renderer";
import { stampDefinitions } from "./definitions";
import { stampRenderers } from "./renderers";

export const stampCatalog = createCatalog(stampDefinitions, stampRenderers, {
  catalogId: "postnl-stamp",
  includeBasicCatalog: true,
});
