"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function ChatButton() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // BottomNav only shows on "/" in your current setup (gate). Adjust if needed.
  const bottomNavVisible = isMobile && pathname === "/";

  // If BottomNav visible, lift chat button above it.
  const bottomPx = bottomNavVisible ? 110 : 20; // 110px clears your BottomNav height + margin

  return (
    <button
      onClick={() => router.push("/chatme")}
      className="fixed right-5 rounded-full border-none cursor-pointer text-white text-[22px]
                 shadow-[0_6px_18px_rgba(0,0,0,0.25)] z-[1000]
                 w-14 h-14 bg-orange-500 hover:bg-orange-600 active:scale-95 transition"
      style={{
        bottom: `calc(${bottomPx}px + env(safe-area-inset-bottom))`,
      }}
      aria-label="Open chat"
      title="Chat"
      type="button"
    >
      💬
    </button>
  );
}