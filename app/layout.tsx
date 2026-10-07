import type { Metadata } from "next";
import {brand} from '@/lib/brand';
import "./globals.css";
import {AppPreferencesProvider,AppearanceShortcut} from "@/components/app-preferences";

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
      <body className="antialiased"><AppPreferencesProvider>{children}<AppearanceShortcut/></AppPreferencesProvider></body>
    </html>
  );
}
