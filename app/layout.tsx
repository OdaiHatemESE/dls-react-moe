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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider defaultLocale="ar">
              <IconProvider>
                <SWRProvider>
                  {/* Vertical Sidebar Header */}
                  <SiteHeader />
                  <Switcher />
                  
                  {/* Main content area with sidebar offset */}
                  <MainContent>
                    {children}
                  </MainContent>
                  <SiteFooter />
                  
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
import VerticalHeader from "./components/VerticalHeader";
import MainContent from "./components/MainContent";
import Footer from "./components/Footer";
import AuthProvider from "./components/AuthProvider";
import IconProvider from "./components/icons/IconProvider";
import { I18nProvider } from "./i18n/I18nProvider";
import SWRProvider from "@/app/components/SWRProvider";

import Switcher from "@/app/components/Switcher";
import ThemeProvider from "@/app/components/ThemeProvider";

function SiteHeader() {
  return <VerticalHeader />;
}

function SiteFooter() {
  return <Footer />;
}
