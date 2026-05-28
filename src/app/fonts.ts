import { Noto_Sans_Thai, Roboto_Mono } from "next/font/google";

export const sans = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});

export const display = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap"
});

export const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "700"],
  display: "swap"
});

export const dashboardThaiSans = Noto_Sans_Thai({
  subsets: ["latin", "thai"],
  variable: "--font-prompt",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap"
});
