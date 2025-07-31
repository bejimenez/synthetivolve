// src/app/layout.tsx (Updated to use AppDataProvider)
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AppDataProvider } from "@/components/data/AppDataProvider";
import { ThemeProvider } from "@/components/theme-provider";
import AppWrapper from "@/components/layout/AppWrapper";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Synthetivolve - Your Personal Health & Wellness Engine",
  description: "A data-driven health and wellness application that provides personalized insights and actionable recommendations through intelligent analysis of nutrition, fitness, and biometric data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* Single unified data provider replaces multiple providers */}
            <AppDataProvider>
              <AppWrapper>{children}</AppWrapper>
              <MobileBottomNav />
            </AppDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}