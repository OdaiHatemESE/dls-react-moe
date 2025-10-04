'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { 
  DashboardIcon, 
  MessagesIcon, 
  AnnouncementsIcon, 
  CalendarIcon, 
  ProfileIcon,
  BellIcon,
  ChevronDownIcon,
  MenuIcon,
  XIcon
} from './icons';
import { useSession, signOut } from 'next-auth/react';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  type NavItem = { key: keyof typeof t.nav; href: string; icon: typeof DashboardIcon } & ({ badge: string } | { badge?: undefined });
  const navigation: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', icon: DashboardIcon },
    // { key: 'messages', href: '/messages', icon: MessagesIcon, badge: '2' },
    { key: 'announcements', href: '/announcements', icon: AnnouncementsIcon },
    { key: 'calendar', href: '/calendar', icon: CalendarIcon },
    { key: 'profile', href: '/profile', icon: ProfileIcon }
  ];

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-xl">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-purple-50/50" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Enhanced Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/dashboard" 
              className="group flex items-center gap-3 text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg px-3 py-2"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center  group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="hidden sm:block">ParentPortal</span>
            </Link>
          </div>

          {/* Enhanced Navigation - Desktop */}
          <nav className={clsx("hidden lg:flex gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-2  border border-white/20")} role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl ${locale === 'ar' ? 'text-xs font-medium' : 'text-sm font-semibold'} transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:scale-105 ${
                    isActive
                      ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 '
                      : 'text-gray-700 hover:text-blue-600 hover:bg-white/80 hover:shadow-md'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div className={`p-1 rounded-lg transition-all duration-300 ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-100 group-hover:bg-blue-100'
                  }`}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span>{t.nav[item.key]}</span>
                  {item.badge && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse " aria-label={`${item.badge} unread`}>
                      {item.badge}
                    </span>
                  )}
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full " />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Enhanced Secondary Navigation */}
          <div className={clsx("flex items-center gap-4")}> 
            {/* Enhanced Language Switch */}
            <button
              className="group relative p-3 text-gray-600 hover:text-blue-600 hover:bg-white/80 backdrop-blur-sm rounded-xl border border-white/20  hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-3 transition-all duration-300 hover:scale-105"
              aria-label={t.common.switchLanguage}
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              title={t.common.switchLanguage}
            >
              <div className="p-1 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300">
                <svg className="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256">
                  <rect width="256" height="256" fill="none"></rect>
                  <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></circle>
                  <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                  <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                  <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                </svg>
              </div>
              <span className={`hidden sm:inline ${locale === 'ar' ? 'text-xs font-medium' : 'text-sm font-semibold'}`}>{t.common.switchLanguage}</span>
              <span className={`${locale === 'ar' ? 'text-xs' : 'text-xs'} font-bold px-2 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md`}>{locale.toUpperCase()}</span>
            </button>

       
            {/* Notifications */}
            {/* <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              <span className="absolute -top-1 -ie-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label="3 unread notifications">
                3
              </span>
            </button> */}

            {/* Enhanced User Avatar Menu */}
            <div className="hidden md:block relative group">
              <button
                className="group/button flex items-center gap-3 text-sm text-gray-700 hover:text-blue-600 hover:bg-white/80 backdrop-blur-sm rounded-xl border border-white/20  hover:shadow-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:scale-105"
                aria-label="User menu"
                tabIndex={0}
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center  group-hover/button:shadow-xl transition-all duration-300">
                    <ProfileIcon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-0 group-hover/button:opacity-30 transition-opacity duration-300" />
                </div>
                <div className="hidden sm:block">
                  <div className={`text-left ${locale === 'ar' ? 'font-medium text-sm' : 'font-semibold'}`}>
                    {(() => {
                      const name = (session?.user?.name as string) || '';
                      return typeof name === 'string' && name ? name.split(' ')[0] : 'Profile';
                    })()}
                  </div>
                  <div className={`text-gray-500 ${locale === 'ar' ? 'text-xs' : 'text-xs'}`}>
                    {locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile'}
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 group-hover/button:rotate-180 transition-transform duration-300" />
              </button>
              
              {/* Enhanced Dropdown menu */}
              <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 z-50 pointer-events-none group-hover:pointer-events-auto group-focus-within:pointer-events-auto">
                <div className="p-2">
                  <Link
                    href="/profile"
                    className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} transition-all duration-200 group/item`}
                  >
                    <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 transition-colors">
                      <ProfileIcon className="w-4 h-4" />
                    </div>
                    {t.nav.profile}
                  </Link>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} transition-all duration-200 group/item`}
                    onClick={() => signOut({ callbackUrl: '/login' })}
                  >
                    <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-red-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    {'Logout'}
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Mobile menu button */}
            <button 
              className="lg:hidden p-3 text-gray-600 hover:text-blue-600 hover:bg-white/80 backdrop-blur-sm rounded-xl border border-white/20  hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 hover:scale-105"
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

        {/* Enhanced Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 backdrop-blur-md">
            <div className="bg-gradient-to-b from-white/95 to-gray-50/95 p-4">
              {/* Navigation Links - Mobile */}
              <nav className="space-y-2" role="navigation" aria-label="Mobile navigation">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center gap-4 px-4 py-4 rounded-2xl ${locale === 'ar' ? 'text-sm font-medium' : 'text-base font-semibold'} transition-all duration-300 border ${
                        isActive
                          ? 'text-white bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 '
                          : 'text-gray-700 hover:text-blue-600 bg-white/60 hover:bg-white/80 border-white/30 hover:border-blue-200 hover:shadow-md'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 group-hover:bg-blue-100'
                      }`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <span className="flex-1">{t.nav[item.key]}</span>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse ">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Enhanced User Info - Mobile */}
              <div className="mt-6 pt-6 border-t border-gray-200/50">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center ">
                      <ProfileIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className={`text-gray-900 ${locale === 'ar' ? 'text-sm font-semibold' : 'text-base font-bold'}`}>
                        {(session?.user?.name as string) || 'Profile'}
                      </p>
                      <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>
                        {(session?.user?.email as string) || ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/profile"
                      className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} rounded-xl transition-all duration-200 group/item`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="p-1 rounded-lg bg-gray-100 group-hover/item:bg-blue-100 transition-colors">
                        <ProfileIcon className="w-4 h-4" />
                      </div>
                      {t.nav.profile}
                    </Link>
                    <button
                      className={`flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} rounded-xl transition-all duration-200 group/item`}
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
      </div>
    </header>
  );
}
