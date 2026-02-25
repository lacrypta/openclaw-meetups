import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "OpenClaw Meetups | La Crypta Buenos Aires",
  description:
    "Monthly OpenClaw AI meetups at La Crypta, Belgrano, Buenos Aires. Connect with Nostr, learn about open-source AI.",
  icons: {
    icon: "/lobster.svg",
  },
  openGraph: {
    title: "OpenClaw Meetups | La Crypta Buenos Aires",
    description:
      "Monthly OpenClaw AI meetups at La Crypta, Belgrano, Buenos Aires.",
    type: "website",
    url: "https://github.com/lacrypta/openclaw-meetups",
    images: [
      {
        url: "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/event-covers/5m/430a67d8-047b-4a35-b57c-65441a39ecc9.png",
        width: 800,
        height: 800,
      },
    ],
    siteName: "OpenClaw Meetups",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenClaw Meetups | La Crypta Buenos Aires",
    description:
      "Monthly OpenClaw AI meetups at La Crypta, Belgrano, Buenos Aires.",
    images: [
      "https://images.lumacdn.com/cdn-cgi/image/format=auto,fit=cover,dpr=2,background=white,quality=75,width=400,height=400/event-covers/5m/430a67d8-047b-4a35-b57c-65441a39ecc9.png",
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-[family-name:var(--font-inter)]">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
