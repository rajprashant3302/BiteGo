"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";

export default function NavbarOnlyHome() {
  const pathname = usePathname();
  if (pathname !== "/") return null;
  return <Navbar />;
}