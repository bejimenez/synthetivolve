// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { WeightDataProvider } from "@/components/weight/WeightDataProvider";
import { GoalsDataProvider } from "@/components/goals/GoalsDataProvider";
import { FitnessDataProvider } from "@/components/fitness/FitnessDataProvider";
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
            <WeightDataProvider>
              <GoalsDataProvider>
                <FitnessDataProvider>
                  <AppWrapper>{children}</AppWrapper>
                  <MobileBottomNav />
                </FitnessDataProvider>
              </GoalsDataProvider>
            </WeightDataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}