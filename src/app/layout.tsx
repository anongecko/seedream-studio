import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "SeaDream Studio - AI Image Generation",
  description: "Create stunning images with BytePlus Seedream AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider defaultTheme="system" storageKey="seedream-ui-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
