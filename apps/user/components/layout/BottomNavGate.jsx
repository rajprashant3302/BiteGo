"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/layout/BottomNav";

export default function BottomNavGate() {
  const pathname = usePathname();

  // Hide BottomNav on these pages
  const HIDE_PREFIXES = ["/login", "/signup", "/chatme", "/admin"];

  const shouldHide = HIDE_PREFIXES.some((p) => pathname.startsWith(p));

  // Also hide on any route you don't have yet:
  // if (pathname === "/search" || pathname === "/saved" || pathname === "/settings") return null;

  if (shouldHide) return null;

  // ✅ Show only on home (strict)
  if (pathname !== "/") return null;

  return <BottomNav />;
}