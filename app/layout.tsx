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
};

import HtmlLangDirProvider from "@/app/components/HtmlLangDirProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100`}>
        <AuthProvider>
          <IconProvider>
            <I18nProvider defaultLocale="ar">
              <SWRProvider>
                {/* Global Header */}
                <SiteHeader />
                <main className="flex-1">{children}</main>
                <SiteFooter />
                {/* Dynamically update lang/dir on client */}
                <HtmlLangDirProvider />
              </SWRProvider>
            </I18nProvider>
          </IconProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

// Local imports placed after component to avoid hoist issues in app dir
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./components/AuthProvider";
import IconProvider from "./components/icons/IconProvider";
import { I18nProvider } from "./i18n/I18nProvider";
import SWRProvider from "@/app/components/SWRProvider";

function SiteHeader() {
  return <Header />;
}

function SiteFooter() {
  return <Footer />;
}
