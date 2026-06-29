import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "YT Downloader - Stahujte YouTube videa zdarma",
  description:
    "Moderní nástroj pro stahování YouTube videí. Vložte odkaz a stahujte videa v různých kvalitách včetně MP3 audia.",
  keywords: [
    "youtube downloader",
    "stahování youtube",
    "yt download",
    "video downloader",
  ],
  openGraph: {
    title: "YT Downloader - Stahujte YouTube videa zdarma",
    description:
      "Moderní nástroj pro stahování YouTube videí v různých kvalitách.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="dark" storageKey="yt-web-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}