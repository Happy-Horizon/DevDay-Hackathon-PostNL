import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";
import "./stamp.css";

export const metadata: Metadata = {
  title: "PostNL — Hackathon Starter",
  description:
    "Agent-to-UI × PostNL. Conversational interface powered by Gemini and the Stamp design system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full flex flex-col bg-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
