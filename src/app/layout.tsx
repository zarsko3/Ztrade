import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layouts/Sidebar";
import { NotificationProvider } from "@/components/NotificationSystem";
import { ThemeProvider } from "@/lib/theme-context";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Trade - Professional Trading Dashboard",
  description: "Track your stock trades and benchmark against the S&P 500 with professional analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="icon" href="/LOGO.png" type="image/png" />
        </head>
        <body className="bg-gray-50/50 dark:bg-gray-900/50 font-sans antialiased">
          <ThemeProvider>
            <NotificationProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <StagewiseToolbar
                config={{
                  plugins: [ReactPlugin],
                }}
              />
            </NotificationProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
