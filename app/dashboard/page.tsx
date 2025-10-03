"use client";

import React from 'react';
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ChildCards from "./components/ChildCards";
import RecentAnnouncements from "./components/RecentAnnouncements";
import UpcomingEvents from "./components/UpcomingEvents";
import { 
  CalendarIcon, 
  AnnouncementsIcon,
  ChevronRightIcon
} from "@/app/components/icons";

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();

  // Quick stats data (you can replace with real data)
  const quickStats = [
    {
      title: locale === 'ar' ? 'الإعلانات الجديدة' : 'New Announcements',
      value: '3',
      icon: AnnouncementsIcon,
      color: 'orange',
      href: '/announcements'
    },
    {
      title: locale === 'ar' ? 'الأحداث القادمة' : 'Upcoming Events', 
      value: '2',
      icon: CalendarIcon,
      color: 'purple',
      href: '/calendar'
    },
    {
      title: locale === 'ar' ? 'الرسائل' : 'Messages',
      value: '5',
      icon: () => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      color: 'blue',
      href: '/messages'
    }
  ];

  const quickActions = [
    {
      title: locale === 'ar' ? 'عرض الملف الشخصي' : 'View Profile',
      description: locale === 'ar' ? 'إدارة معلوماتك الشخصية' : 'Manage your personal information',
      href: '/profile',
      icon: () => (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: locale === 'ar' ? 'التقويم المدرسي' : 'School Calendar',
      description: locale === 'ar' ? 'تصفح الأحداث والمواعيد المهمة' : 'Browse important events and dates',
      href: '/calendar',
      icon: CalendarIcon
    }
  ];

  return (
    <div className={clsx("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6", locale === 'ar' && 'direction-rtl')}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {locale === 'ar' ? 'مرحباً' : 'Welcome'}{session?.user?.name ? `, ${session.user.name}` : ''}
            </h1>
            <p className="mt-2 text-gray-600">
              {t.dashboard.welcome || (locale === 'ar' ? 'نظرة عامة على أطفالك ونشاطاتهم المدرسية' : 'Overview of your children and their school activities')}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="text-right text-sm text-gray-500">
              <div>{new Date().toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'long' })}</div>
              <div className="font-medium text-gray-900">
                {new Date().toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {/* <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickStats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Link key={index} href={stat.href} className="group">
              <Card className="transition-all duration-200 border-l-4 border-l-gray-200 hover:border-l-gray-400">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={clsx(
                        "p-2 rounded-lg",
                        stat.color === 'orange' && "bg-orange-50 text-orange-600",
                        stat.color === 'purple' && "bg-purple-50 text-purple-600", 
                        stat.color === 'blue' && "bg-blue-50 text-blue-600"
                      )}>
                        <IconComponent />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div> */}

      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* Children Cards */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {locale === 'ar' ? 'الأطفال' : 'My Children'}
            </h2>
          </div>
          <ChildCards />
        </div>

        {/* Secondary Content 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Announcements  
          <div className="space-y-6">
            <RecentAnnouncements />
            
            {/* Quick Actions Card  
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <svg className="w-5 h-5 me-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link key={index} href={action.href} className="group">
                      <div className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-md group-hover:bg-gray-200 transition-colors">
                          <IconComponent />
                        </div>
                        <div className="ml-3 rtl:ml-0 rtl:mr-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{action.title}</p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events  
          <div>
            <UpcomingEvents />
          </div>
        </div>
        */}
      </div>
    </div>
  );
}