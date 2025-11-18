'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useI18n } from '@/app/i18n/I18nProvider';
import { 
  DashboardIcon,
  SummaryIcon,
  ProfileIcon
} from './icons';
import { Settings } from 'lucide-react';
import useSWR from 'swr';
import { jsonFetcher } from '@/lib/swr';
import { useNotificationCount } from '@/lib/hooks/useNotifications';

export default function MobileBottomNav() {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const { unread } = useNotificationCount();
  
  // Check admin access
  const { data: adminAccess } = useSWR<{ hasAccess: boolean }>('/api/admin/check-access', jsonFetcher);

  type NavItem = { 
    key: keyof typeof t.nav | 'admin' | 'notifications'; 
    href: string; 
    icon: React.ComponentType<{ className?: string }> | (() => React.JSX.Element);
    label: string;
    isAdminOnly?: boolean;
    badge?: string;
  };

  // Build navigation items matching VerticalHeader
  const navigation: NavItem[] = [
    { 
      key: 'dashboard', 
      href: '/dashboard', 
      icon: DashboardIcon,
      label: t.nav.dashboard
    },
    // { 
    //   key: 'summary', 
    //   href: '/parent/summary', 
    //   icon: SummaryIcon,
    //   label: t.nav.summary
    // },
    // Admin panel link - only shown if user has admin access
    ...(adminAccess?.hasAccess ? [{
      key: 'admin' as const,
      href: '/admin/eid',
      icon: Settings as any,
      label: locale === 'ar' ? 'إدارة' : 'Admin',
      isAdminOnly: true
    }] : []),
    // Notifications
    {
      key: 'notifications' as const,
      href: '/notifications',
      icon: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: locale === 'ar' ? 'إشعارات' : 'Alerts',
      badge: unread > 0 ? unread.toString() : undefined
    },
    { 
      key: 'profile', 
      href: '/profile', 
      icon: ProfileIcon,
      label: t.nav.profile
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border shadow-lg">
        <div className="px-2 py-1">
          <nav className="flex justify-between items-center">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "relative flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200 min-w-0 flex-1 mx-0.5",
                    "touch-manipulation select-none active:scale-95",
                    isActive
                      ? item.isAdminOnly
                        ? "text-white bg-gradient-to-r from-aegold-500 to-aegold-600 shadow-md"
                        : "text-primary bg-primary/10 shadow-sm"
                      : item.isAdminOnly
                        ? "text-muted-foreground hover:text-aegold-600 hover:bg-aegold-50"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className="relative">
                    {typeof item.icon === 'function' && item.icon.length === 0 ? (
                      <div className={clsx(
                        "transition-all duration-200",
                        isActive && "scale-110"
                      )}>
                        {(item.icon as () => React.JSX.Element)()}
                      </div>
                    ) : (
                      <item.icon
                        className={clsx(
                          "w-5 h-5 transition-all duration-200",
                          isActive && "scale-110"
                        )} 
                        aria-hidden="true" 
                      />
                    )}
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