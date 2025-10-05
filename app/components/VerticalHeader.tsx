'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { 
  DashboardIcon, 
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
    { key: 'announcements', href: '/announcements', icon: AnnouncementsIcon },
    { key: 'calendar', href: '/calendar', icon: CalendarIcon },
    { key: 'profile', href: '/profile', icon: ProfileIcon }
  ];

  return (
    <>
      {/* Professional Mobile Header */}
      <header className="lg:hidden bg-white/98 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-indigo-50/30" />
        <div className="relative px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Modern Mobile Logo */}
            <div className="flex-shrink-0">
              <Link 
                href="/dashboard" 
                className="group flex items-center gap-3 text-xl font-bold text-slate-900 hover:text-blue-700 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="hidden sm:block font-bold">ParentPortal</span>
              </Link>
            </div>

            {/* Professional Menu Button */}
            <button 
              className="p-2.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100/80 rounded-xl border border-slate-200/60 hover:border-slate-300 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 transition-all duration-300"
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
          <div className="border-t border-slate-200/60 backdrop-blur-md">
            <div className="bg-gradient-to-b from-white/98 to-slate-50/95 p-4">
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
                          ? 'text-white bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-400 shadow-lg'
                          : 'text-slate-700 hover:text-blue-700 bg-white/80 hover:bg-white border-slate-200/60 hover:border-blue-200 hover:shadow-md backdrop-blur-sm'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/25 shadow-sm' 
                          : 'bg-slate-100 group-hover:bg-blue-100'
                      }`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="flex-1 font-medium">{t.nav[item.key]}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse font-medium">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Info - Mobile */}
              <div className="mt-6 pt-6 border-t border-gray-200/50">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <ProfileIcon className="w-7 h-7 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-gray-900 ${locale === 'ar' ? 'text-sm font-bold tracking-wide' : 'text-sm font-bold'}`}>
                        {(session?.user?.name as string) || 'Profile'}
                      </p>
                      <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs font-medium' : 'text-xs'}`}>
                        {(session?.user?.email as string) || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/profile"
                      className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-primary/10 transition-colors">
                        <ProfileIcon className="w-4 h-4" />
                      </div>
                      {t.nav.profile}
                    </Link>
                    
                    {/* Mobile Theme Settings */}
                    <div className="border-t border-gray-200/50 pt-2 mt-2">
                      <div className={`text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-4 ${locale === 'ar' ? 'text-right text-xs' : 'text-left'}`}>
                        {locale === 'ar' ? 'الإعدادات' : 'Settings'}
                      </div>
                      <button
                        className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-primary hover:bg-primary/5 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item w-full`}
                        onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                        data-theme-menu
                      >
                        <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-primary/10 transition-colors">
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
                                    : 'hover:bg-blue-50 hover:text-primary-600 text-gray-600'
                                } ${locale === 'ar' ? 'text-xs font-medium' : 'text-xs'}`}
                              >
                                <div className={`w-6 h-6 rounded ${theme.preview} shadow-sm ring-1 ring-white/30`}>
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
                      className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'} rounded-xl transition-all duration-200 group/item`}
                      onClick={() => { setIsMenuOpen(false); signOut({ callbackUrl: '/login' }); }}
                    >
                      <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-red-100 transition-colors">
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
      <aside className={`hidden lg:fixed lg:flex lg:flex-col z-50 ${
        locale === 'ar' ? 'lg:right-4 lg:top-6 lg:bottom-6' : 'lg:left-4 lg:top-6 lg:bottom-6'
      } lg:w-72`}>
        <div className={`flex grow flex-col gap-y-6 overflow-y-auto bg-white shadow-lg px-6 pb-6 rounded-2xl border border-slate-200/60`}>
          {/* Modern gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 via-white to-indigo-50/10 rounded-2xl" />
   
          <div className="relative">
            {/* Professional Desktop Logo */}
            <div className="flex h-20 shrink-0 items-center justify-center border-b border-slate-100 mb-6">
              <Link 
                href="/dashboard" 
                className={`group flex items-center gap-4 text-slate-900 hover:text-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 rounded-xl px-4 py-3 hover:bg-slate-50 ${locale === 'ar' ? 'text-xl font-black tracking-wide' : 'text-xl font-bold'}`}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 shadow-md">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="font-bold">{locale === 'ar' ? 'بوابة الأولياء' : 'ParentPortal'}</span>
              </Link>
            </div>

            {/* Modern Desktop Navigation */}
            <nav className="flex flex-1 flex-col" role="navigation" aria-label="Main navigation">
              <ul role="list" className="flex flex-1 flex-col gap-y-1">
                <li>
                  <ul role="list" className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                      
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={clsx(
                              'group flex items-center gap-x-4 rounded-lg px-4 py-3 transition-all duration-200',
                              locale === 'ar' ? 'text-sm font-semibold tracking-wide' : 'text-sm font-medium',
                              isActive
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                            )}
                            aria-current={isActive ? 'page' : undefined}
                          >
                            <div className={clsx(
                              'flex h-6 w-6 shrink-0 items-center justify-center transition-all duration-200',
                              isActive 
                                ? 'text-white' 
                                : 'text-slate-600 group-hover:text-slate-700'
                            )}>
                              <Icon className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <span className="truncate font-medium">{t.nav[item.key]}</span>
                            {item.badge && (
                              <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>

                {/* Settings and User Section */}
                <li className="mt-auto">
                  <div className="border-t border-slate-200/60 pt-6 mb-4">
                  </div>
                  {/* Language Switch */}
                  <button
                    className={`group w-full flex items-center gap-x-4 rounded-lg px-4 py-3 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                    onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                    aria-label={t.common.switchLanguage}
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-600 group-hover:text-slate-700 transition-all duration-200">
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" fill="currentColor">
                        <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" strokeWidth="16"/>
                        <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" strokeWidth="16"/>
                      </svg>
                    </div>
                    <span className="truncate font-medium">{t.common.switchLanguage}</span>
                    <span className="ml-auto inline-flex items-center justify-center w-8 h-6 text-xs font-medium text-white bg-blue-600 rounded">
                      {locale.toUpperCase()}
                    </span>
                  </button>

                  {/* Theme Switch */}
                  <div className="relative" data-theme-menu>
                    <button
                      className={`group w-full flex items-center gap-x-4 rounded-lg px-4 py-3 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                      onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
                      aria-label="Switch Theme"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-600 group-hover:text-slate-700 transition-all duration-200">
                        <svg className="h-6 w-6 transition-transform group-hover:rotate-180 duration-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <span className="truncate font-medium">{locale === 'ar' ? 'تغيير المظهر' : 'Switch Theme'}</span>
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded">
                        {themes.find(t => t.name === currentTheme)?.label.split(' ')[0] || 'UAE'}
                      </span>
                    </button>

                    {/* Theme Dropdown Menu */}
                    {isThemeMenuOpen && (
                      <div className="absolute bottom-full left-0 right-0 mb-3 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl z-20 overflow-hidden">
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
                                    : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-primary-600 border-transparent hover:border-blue-100 text-gray-700'
                                } ${locale === 'ar' ? 'text-xs font-semibold tracking-wide' : 'text-xs font-medium'}`}
                              >
                                {/* Theme Preview */}
                                <div className="relative">
                                  <div className={`w-8 h-8 rounded-lg ${theme.preview} shadow-sm ring-2 ring-white/50`}>
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
                        <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-200/50">
                          <p className="text-xs text-gray-500 text-center">
                            {locale === 'ar' ? 'اختر المظهر المفضل' : 'Choose your preferred theme'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* User Profile */}
                  <div className="group relative mt-6">
                    <div className="flex items-center gap-x-3 rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-all duration-200 cursor-pointer border border-slate-200">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <ProfileIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-slate-900 truncate ${locale === 'ar' ? 'text-sm font-semibold tracking-wide' : 'text-sm font-medium'}`}>
                          {((session?.user?.name as string) || '').split(' ')[0] || 'Profile'}
                        </p>
                        <p className={`text-slate-500 truncate ${locale === 'ar' ? 'text-xs' : 'text-xs'}`}>
                          {locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                        </p>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>

                    {/* User Dropdown */}
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 pointer-events-none group-hover:pointer-events-auto transform translate-y-1 group-hover:translate-y-0">
                      <div className="p-2">
                        <Link
                          href="/profile"
                          className={`flex items-center gap-3 px-3 py-2.5 text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors group/item ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                        >
                          <div className="h-7 w-7 rounded-md bg-slate-100 flex items-center justify-center group-hover/item:bg-blue-50 transition-colors">
                            <ProfileIcon className="h-4 w-4 text-slate-600 group-hover/item:text-blue-600" />
                          </div>
                          {t.nav.profile}
                        </Link>
                        <button
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors group/item ${locale === 'ar' ? 'text-sm font-medium tracking-wide' : 'text-sm font-medium'}`}
                          onClick={() => signOut({ callbackUrl: '/login' })}
                        >
                          <div className="h-7 w-7 rounded-md bg-red-50 flex items-center justify-center group-hover/item:bg-red-100 transition-colors">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          {locale === 'ar' ? 'تسجيل خروج' : 'Logout'}
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