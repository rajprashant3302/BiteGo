import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { usePathname } from "next/navigation";
import "./globals.css";
import SessionWrapper from '../components/SessionWrapper';
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Bottompanel from '../components/Bottompanel'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BiteGo",
  description: "A Food delivery app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
const pathname = usePathname();
  const authRoutes = ["/login", "/register", "/reset-password"];
  const isAuthPage = authRoutes.includes(pathname);


  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <Navbar/>
          <Bottompanel/>
     {children}
     <Footer/>
        </SessionWrapper>
       
      </body>
    </html>
  );
}
