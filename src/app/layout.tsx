import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CELESTIA GALLERIA ✦ — Temple of 3D Lite Commerce",
  description:
    "A Doom-style first-person 3D shopping experience, reborn in golden light. 9-angle sprite imposters, mirror marble, heaven-tier water — and a budget broken with intent. Walk the temple, inspect relics, check out.",
  keywords: ["3D shop", "three.js", "doom", "webgl", "sprite imposters", "e-commerce", "lightweight 3D", "celestia galleria"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "CELESTIA GALLERIA ✦",
    description: "The temple of retail — 9-angle sprites, mirror marble, god rays, a budget gloriously broken.",
    siteName: "CELESTIA GALLERIA",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
