"use client";

import { usePathname } from "next/navigation";
import VerticalHeader from "./VerticalHeader";
import MainContent from "./MainContent";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";
import MobileQuickAccess from "./MobileQuickAccess";
import Switcher from "./Switcher";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Check if current route is an admin route or public route (login, signout, etc.)
  const isAdminRoute = pathname?.startsWith("/admin");
  const isPublicRoute = pathname?.startsWith("/signout") || pathname?.startsWith("/login");

  // For admin and public routes, render only children without navigation
  if (isAdminRoute || isPublicRoute) {
    return <>{children}</>;
  }

  // For regular routes, render with full navigation
  return (
    <>
      {/* Vertical Sidebar Header */}
      <VerticalHeader />
      <Switcher />
      
      {/* Main content area with sidebar offset */}
      <MainContent>
        {children}
      </MainContent>
      <Footer />
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Mobile Quick Access FAB */}
      <MobileQuickAccess />
    </>
  );
}
