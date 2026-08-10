// app/layout.tsx (SERVER)
import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/app/ClientLayout";

const robotoCondensed = Roboto_Condensed({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.velvetvenues.com"),
  title: {
    default: "Velvet Venues – Wedding Venues, Banquet Halls & Event Spaces",
    template: "%s | Velvet Venues",
  },
  description:
    "Book wedding venues, banquet halls, resorts, hotels, and event spaces across India with Velvet Venues.",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <body className={robotoCondensed.variable} suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
