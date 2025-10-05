'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useChildren } from '@/lib/hooks/useChildren';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

export default function MobileQuickAccess() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  
  const eid = status === "authenticated" ? (session?.user?.emiratesId || '') : undefined;
  const { children } = useChildren(eid);

  // Only show if we have children and we're authenticated
  if (status !== "authenticated" || !children || children.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <div className="relative">
          {/* Quick Access Menu */}
          {isOpen && (
            <div className="absolute bottom-16 right-0 mb-2 space-y-2">
              {children.slice(0, 3).map((child, index) => {
                const displayName = locale === 'ar'
                  ? [child.givenName, child.middleName, child.familyName].filter(Boolean).join(' ')
                  : [child.metadata?.englishFirstName, child.metadata?.englishSecondName, child.metadata?.englishThirdName, child.metadata?.englishFamilyName].filter(Boolean).join(' ');
                
                return (
                  <Link
                    key={child.sourcedId}
                    href={`/child/${child.sourcedId}`}
                    onClick={() => setIsOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 bg-card shadow-lg rounded-2xl border border-border",
                      "hover:shadow-xl transition-all duration-200 touch-manipulation active:scale-95",
                      "animate-in slide-in-from-bottom-2 duration-200",
                      locale === 'ar' && 'flex-row-reverse'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                      <span className="text-sm font-bold text-primary-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate max-w-32">
                        {displayName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {locale === 'ar' ? 'عرض الملف' : 'View Profile'}
                      </p>
                    </div>
                  </Link>
                );
              })}
              
              {children.length > 3 && (
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={clsx(
                    "flex items-center justify-center gap-2 px-4 py-3 bg-muted/80 backdrop-blur-sm rounded-2xl",
                    "hover:bg-muted transition-all duration-200 touch-manipulation active:scale-95",
                    "animate-in slide-in-from-bottom-2 duration-200",
                    locale === 'ar' && 'flex-row-reverse'
                  )}
                  style={{ animationDelay: `${3 * 50}ms` }}
                >
                  <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-xs font-medium text-muted-foreground">
                    +{children.length - 3} {locale === 'ar' ? 'المزيد' : 'more'}
                  </span>
                </Link>
              )}
            </div>
          )}

          {/* FAB Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={clsx(
              "w-14 h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary",
              "text-primary-foreground rounded-full shadow-lg hover:shadow-xl",
              "flex items-center justify-center transition-all duration-300",
              "touch-manipulation active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
              isOpen && "rotate-45"
            )}
            aria-label={locale === 'ar' ? 'الوصول السريع للطلاب' : 'Quick access to students'}
          >
            <svg 
              className={clsx(
                "w-6 h-6 transition-transform duration-200",
                isOpen ? "rotate-45" : "rotate-0"
              )} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-30 bg-background/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}