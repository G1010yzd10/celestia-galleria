"use client";

import dynamic from "next/dynamic";

// The 3D shop owns the whole viewport; load it client-side only.
const DoomShop = dynamic(() => import("@/components/doom/DoomShop").then((m) => m.DoomShop), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black flex items-center justify-center font-mono">
      <div className="text-teal-300 text-sm tracking-[0.4em] animate-pulse">
        INITIALIZING SECTOR-7…
      </div>
    </div>
  ),
});

export default function Home() {
  return <DoomShop />;
}
