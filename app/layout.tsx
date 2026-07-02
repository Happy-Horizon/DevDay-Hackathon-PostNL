import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PostNL — Agentic Commerce",
  description:
    "Agentic Commerce × PostNL. Bestel via conversatie met PostNL Fast Checkout — zonder webshop-UI.",
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
