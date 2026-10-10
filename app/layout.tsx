import type { Metadata } from "next";
import {brand} from '@/lib/brand';
import "./globals.css";
import {AppPreferencesProvider} from "@/components/app-preferences";
import {OfflineSupport} from "@/components/offline-support";

export const metadata: Metadata = {
  title: `${brand.name} | Your training, day by day`,
  description: brand.description,
  other: {
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AppPreferencesProvider>{children}</AppPreferencesProvider><OfflineSupport/></body>
    </html>
  );
}
