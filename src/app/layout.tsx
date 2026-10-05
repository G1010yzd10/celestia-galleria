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
  title: "DOOM MART — Celestia Galleria | 3D Lite Commerce Engine",
  description:
    "A Doom-style first-person 3D shopping experience. 9-angle sprite imposters, shader water, sub-4MB VRAM. Walk the sector, inspect products, check out.",
  keywords: ["3D shop", "three.js", "doom", "webgl", "sprite imposters", "e-commerce", "lightweight 3D"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "DOOM MART — Celestia Galleria",
    description: "3D lite commerce engine — 9-angle sprites, mirror marble, god rays, <4MB VRAM.",
    siteName: "DOOM MART",
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
