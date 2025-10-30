'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { 
  DashboardIcon, 
  SummaryIcon,
  MessagesIcon, 
  AnnouncementsIcon,
  CalendarIcon, 
  ProfileIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon
} from './icons';
import { useSession, signOut } from 'next-auth/react';
import { useI18n } from '@/app/i18n/I18nProvider';
import { useTheme } from '@/lib/hooks/useTheme';

type Theme = 'light' | 'blue' | 'green' | 'purple' | 'dark';

interface ThemeOption {
  name: Theme;
  label: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  preview: string;
}

const themes: ThemeOption[] = [
  {
    name: 'light',
    label: 'UAE Gold',
    colors: {
      primary: '#92722a',
      secondary: '#6fb97f', 
      accent: '#d7bc6d'
    },
    preview: 'bg-gradient-to-r from-aegold-500 via-aegreen-400 to-aegold-300'
  },
  {
    name: 'blue',
    label: 'Ocean Blue',
    colors: {
      primary: '#0080ff',
      secondary: '#7dd3fc',
      accent: '#dbeafe'
    },
    preview: 'bg-gradient-to-r from-blue-500 via-sky-300 to-blue-100'
  },
  {
    name: 'green',
    label: 'Nature Green',
    colors: {
      primary: '#059669',
      secondary: '#4ade80',
      accent: '#bbf7d0'
    },
    preview: 'bg-gradient-to-r from-emerald-600 via-green-400 to-green-200'
  },
  {
    name: 'purple',
    label: 'Royal Purple',
    colors: {
      primary: '#9333ea',
      secondary: '#c084fc',
      accent: '#e9d5ff'
    },
    preview: 'bg-gradient-to-r from-purple-600 via-purple-400 to-purple-200'
  },
  {
    name: 'dark',
    label: 'Dark Mode',
    colors: {
      primary: '#d7bc6d',
      secondary: '#4ade80',
      accent: '#374151'
    },
    preview: 'bg-gradient-to-r from-gray-800 via-gray-600 to-gray-700'
  }
];

export default function VerticalHeader() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { theme: currentTheme, switchTheme } = useTheme();

  // Close theme menu when clicking outside or pressing escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isThemeMenuOpen) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isThemeMenuOpen && !(e.target as Element).closest('[data-theme-menu]')) {
        setIsThemeMenuOpen(false);
      }
    };

    if (isThemeMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  type NavItem = { key: keyof typeof t.nav; href: string; icon: typeof DashboardIcon } & ({ badge: string } | { badge?: undefined });
  const navigation: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', icon: DashboardIcon },
    { key: 'summary', href: '/parent/summary', icon: SummaryIcon },
    // { key: 'announcements', href: '/announcements', icon: AnnouncementsIcon },
    // { key: 'calendar', href: '/calendar', icon: CalendarIcon },
    // { key: 'profile', href: '/profile', icon: ProfileIcon }
  ];

  return (
    <>
      {/* Professional Mobile Header */}
      <header className="lg:hidden bg-card/98 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-background to-secondary/5" />
        <div className="relative px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Modern Mobile Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/dashboard" 
                className="group flex items-center gap-3 text-xl font-bold text-foreground hover:text-primary transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="hidden sm:block font-bold">ParentPortal</span>
              </Link>
            </div>

            {/* Professional Menu Button */}
            <button 
              className="p-2.5 text-muted-foreground hover:text-primary hover:bg-muted/80 rounded-xl border border-border hover:border-border/80 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <div className="relative w-6 h-6">
                <div className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`}>
                  <MenuIcon className="w-6 h-6" />
                </div>
                <div className={`absolute inset-0 transition-all duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : 'rotate-180 opacity-0'}`}>
                  <XIcon className="w-6 h-6" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Professional Mobile Navigation */}
        {isMenuOpen && (
          <div className="border-t border-border backdrop-blur-md">
            <div className="bg-gradient-to-b from-card/98 to-muted/95 p-4">
              {/* Enhanced Navigation Links */}
              <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-4 px-4 py-4 rounded-xl ${locale === 'ar' ? 'text-sm font-semibold tracking-wide' : 'text-sm font-semibold'} transition-all duration-300 border ${
                        isActive
                          ? 'text-primary-foreground bg-gradient-to-r from-primary to-primary/80 border-primary/40 shadow-lg'
                          : 'text-foreground hover:text-primary bg-card/80 hover:bg-card border-border hover:border-primary/20 hover:shadow-md backdrop-blur-sm'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-card/25 shadow-sm' 
                          : 'bg-muted group-hover:bg-primary/10'
                      }`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="flex-1 font-medium">{t.nav[item.key]}</span>
                      {item.badge && (
                        <span className="bg-destructive text-destructive-foreground text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Info - Mobile */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      <ProfileIcon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-foreground ${locale === 'ar' ? 'text-sm font-bold tracking-wide' : 'text-sm font-bold'}`}>
                        {(session?.user?.name as string) || 'Profile'}
                      </p>
                      <p className={`text-muted-foreground ${locale === 'ar' ? 'text-xs font-medium' : 'text-xs'}`}>
                        {(session?.user?.email as string) || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/profile"
                      className={`flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="p-1 rounded-lg bg-muted group-hover/item:bg-primary/10 transition-colors">
                        <ProfileIcon className="w-4 h-4" />
                      </div>
                      {t.nav.profile}
                    </Link>
                    
                    {/* Mobile Theme Settings */}
                    <div className="border-t border-border pt-2 mt-2">
                      <div className={`text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-4 ${locale === 'ar' ? 'text-right text-xs' : 'text-left'}`}>
                        {locale === 'ar' ? 'الإعدادات' : 'Settings'}
                      </div>
                      <button
                        className={`flex items-center gap-3 px-4 py-3 text-foreground hover:text-primary hover:bg-primary/5 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item w-full`}
                        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                        data-theme-menu
                      >
                        <div className="p-1 rounded-lg bg-muted group-hover/item:bg-primary/10 transition-colors">
                          <svg className="w-4 h-4 transition-transform group-hover/item:rotate-180 duration-300" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </div>
                        {locale === 'ar' ? 'تغيير المظهر' : 'Switch Theme'}
                        <span className="ml-auto text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {themes.find(t => t.name === currentTheme)?.label.split(' ')[0] || 'UAE'}
                        </span>
                      </button>
                      
                      {/* Mobile Theme Options */}
                      {isThemeMenuOpen && (
                        <div className="mt-2 space-y-1 px-2" data-theme-menu>
                          {themes.map((theme) => {
                            const isActive = currentTheme === theme.name;
                            
                            return (
                              <button
                                key={theme.name}
                                onClick={() => {
                                  switchTheme(theme.name);
                                  setIsThemeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? 'bg-primary/10 border border-primary/20 text-primary'
                                    : 'hover:bg-primary/5 hover:text-primary text-muted-foreground'
                                } ${locale === 'ar' ? 'text-xs font-medium' : 'text-xs'}`}
                              >
                                <div className={`w-6 h-6 rounded ${theme.preview} shadow-sm ring-1 ring-card/30`}>
                                  {theme.name === 'dark' && (
                                    <div className="w-full h-full rounded bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                      <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <span className="flex-1 text-left">{theme.label}</span>
                                {isActive && (
                                  <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                  </svg>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <button
                      className={`flex items-center gap-3 px-4 py-3 text-foreground hover:text-destructive hover:bg-destructive/5 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item`}
                      onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                    >
                      <div className="p-1 rounded-lg bg-muted group-hover/item:bg-destructive/10 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Professional Desktop Sidebar */}
      <aside className={`hidden lg:fixed lg:flex lg:flex-col lg:inset-y-0 z-50 ${
        locale === 'ar' ? 'lg:right-0' : 'lg:left-0'
      } lg:w-80`}>
        <div className={`relative flex grow flex-col gap-y-6 overflow-y-auto bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-xl shadow-2xl px-7 pb-7 border-r-2 border-border/50 hover:border-primary/20 transition-all duration-500`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/10 to-transparent rounded-full -translate-y-20 translate-x-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full translate-y-16 -translate-x-16 blur-2xl" />
   
          <div className="relative">
            {/* Professional Desktop Logo */}
            <div className="flex h-24 shrink-0 items-center justify-center border-b-2 border-border/30 mb-8">
              <Link 
                href="/dashboard" 
                className={`group flex items-center gap-4 text-foreground hover:text-primary transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 rounded-2xl px-5 py-4 hover:bg-primary/5 ${locale === 'ar' ? 'text-xl font-black tracking-wide' : 'text-2xl font-bold'}`}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-md group-hover:blur-lg transition-all" />
                  <div className="relative w-14 h-14 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl flex items-center justify-center group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                    <svg className="w-8 h-8 text-primary-foreground group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold group-hover:translate-x-1 transition-transform">{locale === 'ar' ? 'بوابة أولياء الأمور' : 'Parent Portal'}</span>
                  <span className="text-xs text-muted-foreground font-medium">{locale === 'ar' ? 'وزارة التربية' : 'MOE'}</span>
                </div>
              </Link>
            </div>

            {/* Modern Desktop Navigation */}
            <nav className="flex flex-1 flex-col" role="navigation" aria-label="Main navigation">
              <ul role="list" className="flex flex-1 flex-col gap-y-2">
                <li>
                  <ul role="list" className="space-y-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={clsx(
                              'group relative flex items-center gap-x-4 rounded-2xl px-5 py-4 transition-all duration-300 overflow-hidden',
                              locale === 'ar' ? 'text-base font-semibold tracking-wide' : 'text-base font-semibold',
                              isActive
                                ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 scale-105'
                                : 'text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary hover:scale-102 hover:shadow-md'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {/* Active indicator */}
                            {isActive && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-foreground rounded-r-full" />
                            )}
                            
                            {/* Icon with background */}
                            <div className={clsx(
                              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300',
                              isActive 
                                ? 'bg-primary-foreground/20 text-primary-foreground shadow-inner' 
                                : 'bg-muted/50 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-110 group-hover:rotate-3'
                            )}>
                              <Icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            
                            <span className="truncate font-semibold flex-1">{t.nav[item.key]}</span>
                            
                            {item.badge && (
                              <span className="ml-auto inline-flex items-center justify-center min-w-6 h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg animate-pulse">
                                {item.badge}
                              </span>
                            )}
                            
                            {/* Hover arrow */}
                            {!isActive && (
                              <svg className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                              </svg>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>

                {/* Settings and User Section */}
                <li className="mt-auto">
                  <div className="border-t border-border pt-6 mb-4">
                  </div>
                  {/* Language Switch */}
                  <button
                    className={`group w-full flex items-center gap-x-4 rounded-lg px-4 py-3 text-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                    onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                    aria-label={t.common.switchLanguage}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-200">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" strokeWidth="16"/>
                      </svg>
                    </div>
                    <span className="truncate font-medium">{t.common.switchLanguage}</span>
                    <span className="ml-auto inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-primary-foreground bg-primary rounded">
                      {locale.toUpperCase()}
                    </span>
                  </button>

                  {/* Theme Switch */}
                  <div className="relative" data-theme-menu>
                    <button
                      className={`group w-full flex items-center gap-x-4 rounded-lg px-4 py-3 text-foreground hover:bg-muted hover:text-foreground transition-all duration-200 ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                      aria-label="Switch Theme"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-muted-foreground group-hover:text-foreground transition-all duration-200">
                        <svg className="h-6 w-6 transition-transform group-hover:rotate-180 duration-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <span className="truncate font-medium">{locale === 'ar' ? 'تغيير المظهر' : 'Switch Theme'}</span>
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-primary-foreground bg-primary rounded">
                        {themes.find(t => t.name === currentTheme)?.label.split(' ')[0] || 'UAE'}
                      </span>
                    </button>

                    {/* Theme Dropdown Menu */}
                    {isThemeMenuOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-3 bg-gradient-to-b from-card/95 to-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl z-20 overflow-hidden">
                        <div className="p-3 space-y-2">
                          {themes.map((theme) => {
                            const isActive = currentTheme === theme.name;
                            
                            return (
                              <button
                                key={theme.name}
                                onClick={() => {
                                  switchTheme(theme.name);
                                  setIsThemeMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-sm border group/theme ${
                                  isActive
                                    ? 'bg-primary/10 border-primary/20 text-primary'
                                    : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-secondary/5 hover:text-primary border-transparent hover:border-primary/10 text-foreground'
                                } ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'}`}
                              >
                                {/* Theme Preview */}
                                <div className="relative">
                                  <div className={`w-8 h-8 rounded-lg ${theme.preview} shadow-sm ring-2 ring-card/50`}>
                                    {theme.name === 'dark' && (
                                      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                          <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/>
                                        </svg>
                                      </div>
                                    )}
                                  </div>
                                  {isActive && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-sm">
                                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 text-left">
                                  <div className="font-semibold">{theme.label}</div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <div 
                                      className="w-2 h-2 rounded-full border border-white/50 shadow-sm" 
                                      style={{ backgroundColor: theme.colors.primary }}
                                    />
                                    <div 
                                      className="w-2 h-2 rounded-full border border-white/50 shadow-sm" 
                                      style={{ backgroundColor: theme.colors.secondary }}
                                    />
                                    <div 
                                      className="w-2 h-2 rounded-full border border-white/50 shadow-sm" 
                                      style={{ backgroundColor: theme.colors.accent }}
                                    />
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <div className="px-4 py-2 bg-muted/50 border-t border-border">
                          <p className="text-xs text-muted-foreground text-center">
                            {locale === 'ar' ? 'اختر المظهر المفضل' : 'Choose your preferred theme'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="group relative mt-6">
                    <div className="flex items-center gap-x-4 rounded-2xl p-4 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border-2 border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-lg">
                          <ProfileIcon className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-card rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-foreground truncate font-bold ${locale === 'ar' ? 'text-sm tracking-wide' : 'text-sm'}`}>
                          {((session?.user?.name as string) || '').split(' ').slice(0, 2).join(' ') || 'Parent Profile'}
                        </p>
                        <p className={`text-muted-foreground truncate ${locale === 'ar' ? 'text-xs font-medium' : 'text-xs'}`}>
                          {locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                        </p>
                      </div>
                      <ChevronDownIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:rotate-180 transition-all duration-300" />
                    </div>

                    {/* User Dropdown */}
                    <div className="absolute bottom-full left-0 right-0 mb-3 bg-gradient-to-b from-card via-card to-card/95 backdrop-blur-xl border-2 border-border/50 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 pointer-events-none group-hover:pointer-events-auto transform translate-y-2 group-hover:translate-y-0 overflow-hidden">
                      <div className="p-3">
                        <Link
                          href="/profile"
                          className={`flex items-center gap-3 px-4 py-3.5 text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent rounded-xl transition-all duration-200 group/item ${locale === 'ar' ? 'text-sm font-semibold tracking-wide' : 'text-sm font-semibold'}`}
                        >
                          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover/item:bg-primary/20 group-hover/item:scale-110 transition-all">
                            <ProfileIcon className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1">{t.nav.profile}</span>
                          <svg className="w-4 h-4 text-primary opacity-0 group-hover/item:opacity-100 transform -translate-x-1 group-hover/item:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                          </svg>
                        </Link>
                        <div className="my-2 border-t border-border/50" />
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-destructive hover:text-white hover:bg-gradient-to-r hover:from-destructive hover:to-destructive/90 rounded-xl transition-all duration-200 group/item font-semibold ${locale === 'ar' ? 'text-sm tracking-wide' : 'text-sm'}`}
                          onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                          <div className="h-9 w-9 rounded-xl bg-destructive/10 group-hover/item:bg-white/20 flex items-center justify-center group-hover/item:scale-110 transition-all">
                            <svg className="h-5 w-5 group-hover/item:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <span className="flex-1">{locale === 'ar' ? 'تسجيل خروج' : 'Logout'}</span>
                          <svg className="w-4 h-4 opacity-0 group-hover/item:opacity-100 group-hover/item:text-white transform -translate-x-1 group-hover/item:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}