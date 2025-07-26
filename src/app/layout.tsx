import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layouts/Sidebar";
import { NotificationProvider } from "@/components/NotificationSystem";
import { ThemeProvider } from "@/lib/theme-context";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import ReactPlugin from "@stagewise-plugins/react";

export const metadata: Metadata = {
  title: "TradeTracker - Professional Trading Dashboard",
  description: "Track your stock trades and benchmark against the S&P 500 with professional analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 font-sans antialiased">
        <ThemeProvider>
          <NotificationProvider>
            <div className="flex h-screen">
              <Sidebar />
              <main className="flex-1 lg:ml-64 overflow-auto">
                <div className="p-8">
                  {children}
                </div>
              </main>
            </div>
            <StagewiseToolbar
              config={{
                plugins: [ReactPlugin],
              }}
            />
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
