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
    <div className={clsx("min-h-screen bg-gradient-to-br from-background to-aegold-50/30", locale === 'ar' && 'direction-rtl')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-12">
          <Card className="border-0 shadow-xl bg-primary overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='nonzero'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <CardContent className="relative p-8 sm:p-12">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div className="flex-1 mb-6 sm:mb-0">
                  <h1 className={`${locale === 'ar' ? 'text-3xl sm:text-4xl font-semibold' : 'text-4xl sm:text-5xl font-bold'} text-white mb-4 drop-shadow-lg`}>
                    {locale === 'ar' ? 'مرحباً' : 'Welcome'}{session?.user?.name ? `, ${session.user.name}` : ''}
                  </h1>
                  <p className={`${locale === 'ar' ? 'text-lg font-normal' : 'text-xl font-medium'} text-aegold-100 max-w-2xl`}>
                    {t.dashboard.welcome || (locale === 'ar' ? 'نظرة عامة على أطفالك ونشاطاتهم المدرسية' : 'Overview of your children and their school activities')}
                  </p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-center">
                    <div className={`text-white/80 ${locale === 'ar' ? 'text-xs font-normal' : 'text-sm font-medium'} mb-1`}>
                      {new Date().toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { weekday: 'long' })}
                    </div>
                    <div className={`text-white ${locale === 'ar' ? 'text-base font-semibold' : 'text-lg font-bold'}`}>
                      {new Date().toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className={`text-white/60 ${locale === 'ar' ? 'text-xs' : 'text-xs'} mt-1`}>
                      {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                        stat.color === 'blue' && "bg-aegold-50 text-aegold-600"
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
        {/* Enhanced Children Section */}
        <div>
          <div className="mb-8">
            <Card className="border-0 bg-white ">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary rounded-xl">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className={`${locale === 'ar' ? 'text-xl font-semibold' : 'text-2xl font-bold'} text-gray-900`}>
                        {locale === 'ar' ? 'أطفالي' : 'My Children'}
                      </h2>
                      <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'}`}>
                        {locale === 'ar' ? 'إدارة ومتابعة بيانات الأطفال' : 'Manage and track your children\'s information'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`bg-aegold-50 text-aegold-700 border-aegold-200 ${locale === 'ar' ? 'text-xs font-normal' : ''}`}>
                    <svg className={`w-3 h-3 ${locale === 'ar' ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locale === 'ar' ? 'نشط' : 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}