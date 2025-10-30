'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useI18n } from '@/app/i18n/I18nProvider';
import { 
  DashboardIcon,
  SummaryIcon,
  MessagesIcon, 
  AnnouncementsIcon,
  CalendarIcon, 
  ProfileIcon
} from './icons';

export default function MobileBottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname();

  const navigation = [
    { 
      key: 'dashboard' as keyof typeof t.nav, 
      href: '/dashboard', 
      icon: DashboardIcon,
      label: locale === 'ar' ? 'الرئيسية' : 'Home'
    },
    { 
      key: 'summary' as keyof typeof t.nav, 
      href: '/parent/summary', 
      icon: SummaryIcon,
      label: locale === 'ar' ? 'الملخص' : 'Summary'
    },
    { 
      key: 'announcements' as keyof typeof t.nav, 
      href: '/announcements', 
      icon: AnnouncementsIcon,
      label: locale === 'ar' ? 'الإعلانات' : 'News',
      badge: '3'
    },
    { 
      key: 'calendar' as keyof typeof t.nav, 
      href: '/calendar', 
      icon: CalendarIcon,
      label: locale === 'ar' ? 'التقويم' : 'Calendar'
    },
    {
      key: 'messages' as keyof typeof t.nav,
      href: '/messages',
      icon: MessagesIcon,
      label: locale === 'ar' ? 'الرسائل' : 'Messages',
      badge: '5'
    },
    { 
      key: 'profile' as keyof typeof t.nav, 
      href: '/profile', 
      icon: ProfileIcon,
      label: locale === 'ar' ? 'الملف' : 'Profile'
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
        <div className="px-2 py-1">
          <nav className="flex justify-between items-center">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-0.5",
                    "touch-manipulation select-none active:scale-95",
                    isActive
                      ? "text-primary bg-primary/10 shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    <Icon 
                      className={clsx(
                        "w-5 h-5 transition-all duration-200",
                        isActive && "scale-110"
                      )} 
                      aria-hidden="true" 
                    />
                    {item.badge && (
                      <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span 
                    className={clsx(
                      "text-xs font-medium mt-1 leading-tight text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full",
                      locale === 'ar' ? 'font-semibold' : 'font-medium'
                    )}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Mobile Safe Area Bottom Padding */}
      <div className="lg:hidden h-20" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
    </>
  );
}