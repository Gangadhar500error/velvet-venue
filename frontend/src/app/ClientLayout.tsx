"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideLayout =
    pathname === "/signin" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/admin");

  // Admin shell manages its own viewport scroll — avoid a second body scroll
  if (hideLayout) {
    return <div className="h-dvh overflow-hidden bg-background text-foreground">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 pt-[130px]">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
}
