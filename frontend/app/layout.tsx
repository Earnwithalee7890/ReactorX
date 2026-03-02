import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ReactorX – Autonomous On-Chain Liquidation Engine | Somnia Testnet",
  description:
    "ReactorX is a fully on-chain reactive liquidation engine powered by Somnia Native Reactivity. Monitor positions, automatic liquidations — zero bots, zero keepers.",
  keywords: ["Somnia", "DeFi", "Reactivity", "Liquidation", "Blockchain", "On-chain automation"],
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/brand-logo.png",
  },
  openGraph: {
    title: "ReactorX – Autonomous On-Chain Liquidation Engine",
    description: "Keeperless DeFi automation powered by Somnia Native On-Chain Reactivity",
    type: "website",
    images: ["/brand-logo.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/brand-logo.png" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
