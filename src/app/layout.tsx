import './globals.css';
import type { Metadata } from "next";
import "@/app/globals.css";
import { dashboardThaiSans, display, mono, sans } from "@/app/fonts";

export const metadata: Metadata = {
  title: "ORRY Business Deck",
  description: "ORRY commercial operations, billing control, and collection workspace."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} ${mono.variable} ${dashboardThaiSans.variable}`}>{children}</body>
    </html>
  );
}
