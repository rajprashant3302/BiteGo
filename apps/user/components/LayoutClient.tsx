"use client";

import { usePathname } from "next/navigation";
// import Navbar from "./Navbar";
// import Footer from "./Footer";
// import Bottompanel from "./Bottompanel";
import SessionWrapper from "./SessionWrapper";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const authRoutes = ["/login", "/register", "/reset-password"];
  const isAuthPage = authRoutes.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SessionWrapper>
      {/* <Navbar /> */}
      {children}
      {/* <Footer /> */}
      {/* <Bottompanel /> */}
    </SessionWrapper>
  );
}