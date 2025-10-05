"use client";

import React from 'react';
import useSWR from 'swr';
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { jsonFetcher } from "@/lib/swr";
import RefreshBar from "@/components/RefreshBar";
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
  const eid = session?.user?.emiratesId as string | undefined;
  const swrKey = eid ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}` : "/api/oneroster/basic-info-full";
  const { data: parentBasicInfo } = useSWR<any>(swrKey, jsonFetcher);

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
    <div className={clsx("min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30", locale === 'ar' && 'direction-rtl')}>
      {/* Professional Header Section */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Dashboard Header */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4M16 5v4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </h1>
                <p className="text-slate-600 text-sm">
                  {locale === 'ar' ? 'نظرة عامة على أنشطة أطفالك' : 'Overview of your children\'s activities'}
                </p>
              </div>
            </div>

            {/* Data Refresh & Date Info */}
            <div className="flex items-center gap-4">
              <RefreshBar
                swrKey={swrKey}
                meta={parentBasicInfo?.meta}
                className="shrink-0"
                labels={{
                  lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
                  confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
                  refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
                  refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
                  unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
                }}
              />
              
              <div className="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium text-slate-700">
                  {new Date().toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Welcome Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-xl bg-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-200/15 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
            
            <CardContent className="relative p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className={clsx(
                        "text-4xl font-bold text-slate-900 mb-1",
                        locale === 'ar' && "text-3xl leading-relaxed"
                      )}>
                        {locale === 'ar' ? 'مرحباً' : 'Welcome'}
                        {session?.user?.name && (
                          <span className="text-blue-600">, {session.user.name}</span>
                        )}
                      </h1>
                      <p className="text-slate-600 text-lg">
                        {t.dashboard.welcome || (locale === 'ar' ? 'نظرة عامة على أطفالك ونشاطاتهم المدرسية' : 'Overview of your children and their school activities')}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Stats Cards */}
                <div className="flex flex-col sm:flex-row gap-4">
                  {quickStats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Link key={index} href={stat.href} className="group">
                        <div className={clsx(
                          "bg-white/80 backdrop-blur-sm rounded-xl border p-4 shadow-sm hover:shadow-md transition-all duration-200 min-w-[140px]",
                          "group-hover:scale-105 group-hover:border-slate-300"
                        )}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className={clsx(
                              "p-2 rounded-lg",
                              stat.color === 'orange' && "bg-orange-100 text-orange-600",
                              stat.color === 'purple' && "bg-purple-100 text-purple-600", 
                              stat.color === 'blue' && "bg-blue-100 text-blue-600"
                            )}>
                              <IconComponent />
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                          </div>
                          <p className="text-sm font-medium text-slate-600 leading-tight">{stat.title}</p>
                        </div>
                      </Link>
                    );
                  })}
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
        <Card className="border-0 bg-white shadow-lg overflow-hidden">
          {/* Professional Header */}
          <div className="border-b border-slate-200/80 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={clsx(
                      "text-2xl font-bold text-slate-900",
                      locale === 'ar' && "text-xl leading-relaxed"
                    )}>
                      {locale === 'ar' ? 'أطفالي' : 'My Children'}
                    </h2>
                    <p className="text-slate-600 font-medium">
                      {locale === 'ar' ? 'إدارة ومتابعة بيانات الأطفال' : 'Manage and track your children\'s information'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 px-3 py-1.5">
                    <svg className="w-3 h-3 me-1.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{locale === 'ar' ? 'نشط' : 'Active'}</span>
                  </Badge>
                  
                  <div className="hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200">
                    <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-700">
                      {locale === 'ar' ? 'محدث' : 'Updated'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* Enhanced Content */}
          <CardContent className="p-8">
            <ChildCards />
          </CardContent>
        </Card>

        {/* Professional Secondary Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions Section */}
          <div className="space-y-6">
            <Card className="border-0 bg-white shadow-lg overflow-hidden">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-emerald-50 to-green-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3>{locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</h3>
                      <p className="text-sm font-normal text-emerald-700 mt-1">
                        {locale === 'ar' ? 'الوصول السريع للخدمات' : 'Quick access to services'}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="p-6 space-y-4">
                {quickActions.map((action, index) => {
                  const IconComponent = action.icon;
                  return (
                    <Link key={index} href={action.href} className="group block">
                      <div className="flex items-center p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 group-hover:shadow-md">
                        <div className="flex-shrink-0 p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
                          <IconComponent />
                        </div>
                        <div className={clsx("flex-1", locale === 'ar' ? "mr-4" : "ml-4")}>
                          <p className="text-base font-semibold text-slate-900 group-hover:text-slate-800">
                            {action.title}
                          </p>
                          <p className="text-sm text-slate-600 mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ChevronRightIcon className={clsx(
                          "w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-all duration-200 group-hover:translate-x-1",
                          locale === 'ar' && "rotate-180 group-hover:-translate-x-1"
                        )} />
                      </div>
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Recent Announcements */}
            <div className="bg-white rounded-xl shadow-lg border-0 overflow-hidden">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AnnouncementsIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900">
                      {locale === 'ar' ? 'الإعلانات الحديثة' : 'Recent Announcements'}
                    </h3>
                    <p className="text-sm text-amber-700">
                      {locale === 'ar' ? 'آخر الأخبار والتحديثات' : 'Latest news and updates'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <RecentAnnouncements />
              </div>
            </div>
          </div>

          {/* Upcoming Events Section */}
          <div>
            <Card className="border-0 bg-white shadow-lg overflow-hidden h-fit">
              <div className="border-b border-slate-200/80 bg-gradient-to-r from-purple-50 to-violet-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3>{locale === 'ar' ? 'الأحداث القادمة' : 'Upcoming Events'}</h3>
                      <p className="text-sm font-normal text-purple-700 mt-1">
                        {locale === 'ar' ? 'المواعيد والفعاليات المهمة' : 'Important dates and activities'}
                      </p>
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="p-6">
                <UpcomingEvents />
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}