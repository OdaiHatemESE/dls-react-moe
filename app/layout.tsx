import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Parent Portal - Stay Connected with Your Child's Education",
  description: "A comprehensive parent portal for tracking your child's academic progress, attendance, and school communications.",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover'
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Parent Portal"
  },
  formatDetection: {
    telephone: false,
  }
};

import HtmlLangDirProvider from "@/app/components/HtmlLangDirProvider";
import ConditionalLayout from "@/app/components/ConditionalLayout";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Parent Portal" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body 
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`} 
        suppressHydrationWarning
        style={{ 
          paddingTop: 'env(safe-area-inset-top)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider defaultLocale="ar">
              <IconProvider>
                <SWRProvider>
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  
                  {/* Dynamically update lang/dir on client */}
                  <HtmlLangDirProvider />
                </SWRProvider>
              </IconProvider>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Local imports placed after component to avoid hoist issues in app dir
import AuthProvider from "./components/AuthProvider";
import IconProvider from "./components/icons/IconProvider";
import { I18nProvider } from "./i18n/I18nProvider";
import SWRProvider from "@/app/components/SWRProvider";
import ThemeProvider from "@/app/components/ThemeProvider";
