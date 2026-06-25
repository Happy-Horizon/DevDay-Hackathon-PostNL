"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { StampProvider } from "@design-system/react";
import { stampCatalog } from "@/lib/a2ui/catalog";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit" a2ui={{ catalog: stampCatalog }}>
      <StampProvider colorScheme="light" className="flex flex-col flex-1">
        {children}
      </StampProvider>
    </CopilotKit>
  );
}
