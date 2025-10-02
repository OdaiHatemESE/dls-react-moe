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
import { mockParent } from '../data/mockData';
import { useI18n } from '@/app/i18n/I18nProvider';

export default function Header() {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  type NavItem = { key: keyof typeof t.nav; href: string; icon: typeof DashboardIcon } & ({ badge: string } | { badge?: undefined });
  const navigation: NavItem[] = [
    { key: 'dashboard', href: '/dashboard', icon: DashboardIcon },
    // { key: 'messages', href: '/messages', icon: MessagesIcon, badge: '2' },
    { key: 'announcements', href: '/announcements', icon: AnnouncementsIcon },
    { key: 'calendar', href: '/calendar', icon: CalendarIcon },
    { key: 'profile', href: '/profile', icon: ProfileIcon }
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/dashboard" 
              className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1"
            >
              ParentPortal
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className={clsx("hidden lg:flex gap-1")} role="navigation" aria-label="Main navigation">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{t.nav[item.key]}</span>
                  {item.badge && (
                    <span className={clsx("bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ms-1")} aria-label={`${item.badge} unread`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Secondary Navigation */}
          <div className={clsx("flex items-center gap-3")}> 
            {/* Language Switch */}
            <button
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
              aria-label={t.common.switchLanguage}
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              title={t.common.switchLanguage}
            >
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 256 256">
                <rect width="256" height="256" fill="none"></rect>
                <circle cx="128" cy="128" r="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></circle>
                <path d="M168,128c0,64-40,96-40,96s-40-32-40-96,40-96,40-96S168,64,168,128Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
                <line x1="37.46" y1="96" x2="218.54" y2="96" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
                <line x1="37.46" y1="160" x2="218.54" y2="160" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
              </svg>
              <span className="hidden sm:inline text-sm">{t.common.switchLanguage}</span>
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-200 text-gray-700">{locale.toUpperCase()}</span>
            </button>

       
            {/* Notifications */}
            <button 
              className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              <span className="absolute -top-1 -ie-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" aria-label="3 unread notifications">
                3
              </span>
            </button>

            {/* User Avatar Menu */}
            <div className="hidden md:block relative">
              <button 
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="User menu"
              >
                <Image 
                  className="w-8 h-8 rounded-full" 
                  src={mockParent.avatar} 
                  alt={`${mockParent.name} avatar`}
                  width={32}
                  height={32}
                />
                <span className="hidden sm:block font-medium">{mockParent.name.split(' ')[0]}</span>
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <XIcon className="w-6 h-6" />
              ) : (
                <MenuIcon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
         

            {/* Navigation Links - Mobile */}
            <nav className="space-y-1 px-4" role="navigation" aria-label="Mobile navigation">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className="w-5 h-5" aria-hidden="true" />
                    <span>{t.nav[item.key]}</span>
                    {item.badge && (
                      <span className={clsx("bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ms-auto")}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Info - Mobile */}
            <div className="px-4 py-4 border-t border-gray-200 mt-4">
              <div className="flex items-center gap-3">
                <Image 
                  className="w-10 h-10 rounded-full" 
                  src={mockParent.avatar} 
                  alt={`${mockParent.name} avatar`}
                  width={40}
                  height={40}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{mockParent.name}</p>
                  <p className="text-sm text-gray-500">{mockParent.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
