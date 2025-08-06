import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layouts/Sidebar";
import { NotificationProvider } from "@/components/NotificationSystem";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { LayoutWrapper } from "@/components/layouts/LayoutWrapper";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/LOGO.png" type="image/png" />
      </head>
      <body className="bg-gray-50/50 dark:bg-gray-900/50 font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
