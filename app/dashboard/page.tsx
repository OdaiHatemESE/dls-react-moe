"use client";

import React from 'react';
import useSWR from 'swr';
import { useI18n } from "@/app/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { jsonFetcher } from "@/lib/swr";
import RefreshBar from "@/components/RefreshBar";
import ChildCards from "./components/ChildCards";
 
export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const eid = session?.user?.emiratesId as string | undefined;
  const swrKey = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
  const { data: childrenData } = useSWR<any>(swrKey, jsonFetcher);
  
  // Extract meta from response
  const meta = childrenData?.meta;

 

  return (
    <div className={clsx("min-h-screen bg-gradient-to-br from-background via-background to-primary/5", locale === 'ar' && 'direction-rtl')}>
      {/* Mobile App-like Header Section */}
      <div className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 md:py-3 gap-2 min-w-0 overflow-hidden">
            {/* Dashboard Header - Mobile Optimized */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1 overflow-hidden">
              <div className="p-1 md:p-1.5 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm flex-shrink-0">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4M16 5v4" />
                </svg>
              </div>
              <div className="min-w-0 overflow-hidden">
                <h1 className="text-base md:text-xl font-bold text-foreground truncate">
                  {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
                </h1>
                <p className="text-muted-foreground text-xs md:text-xs hidden md:block truncate">
                  {locale === 'ar' ? 'نظرة عامة على أنشطة أطفالك' : 'Overview of your children\'s activities'}
                </p>
              </div>
            </div>

            {/* Data Refresh & Date Info - Mobile Optimized */}
            <div className="flex items-center gap-1 md:gap-2 min-w-0 overflow-hidden">
              <RefreshBar
                swrKey={swrKey}
                meta={meta}
                variant="compact"
                className="flex-shrink-0 min-w-0"
                labels={{
                  lastUpdated: locale === 'ar' ? 'آخر تحديث:' : 'Last updated:',
                  confirm: locale === 'ar' ? 'جلب بيانات حديثة؟' : 'Fetch fresh data?',
                  refresh: locale === 'ar' ? 'تحديث' : 'Refresh',
                  refreshing: locale === 'ar' ? 'جاري التحديث…' : 'Refreshing…',
                  unknown: locale === 'ar' ? 'غير معروف' : 'unknown',
                }}
              />
              
              <div className="hidden lg:flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5 flex-shrink-0">
                <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-foreground whitespace-nowrap">
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
          <Card className="border-0 shadow-xl bg-card overflow-hidden">
            <CardContent className="relative p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className={clsx(
                        "text-2xl font-bold text-foreground mb-1",
                        locale === 'ar' && "text-xl leading-relaxed"
                      )}>
                        {locale === 'ar' ? 'مرحباً' : 'Welcome'}
                        {session?.user?.name && (
                          <span className="text-primary">, {session.user.name}</span>
                        )}
                      </h1>
                      <p className="text-muted-foreground text-sm">
                        {t.dashboard.welcome || (locale === 'ar' ? 'نظرة عامة على أطفالك ونشاطاتهم المدرسية' : 'Overview of your children and their school activities')}
                      </p>
                    </div>
                  </div>
                </div>
                
              
              </div>
            </CardContent>
          </Card>
        </div>
 
      {/* Main Content Grid */}
      <div className="space-y-8">
        {/* Enhanced Children Section */}
        <Card className="border-0 bg-card shadow-lg overflow-hidden">
          {/* Professional Header */}
          <div className="border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm">
                    <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className={clsx(
                      "text-lg font-bold text-foreground",
                      locale === 'ar' && "text-base leading-relaxed"
                    )}>
                      {locale === 'ar' ? 'أطفالي' : 'My Children'}
                    </h2>
                    <p className="text-muted-foreground font-medium text-xs">
                      {locale === 'ar' ? 'إدارة ومتابعة بيانات الأطفال' : 'Manage and track your children\'s information'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 hover:bg-chart-2/20 px-2 py-1">
                    <svg className="w-2.5 h-2.5 me-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-xs">{locale === 'ar' ? 'نشط' : 'Active'}</span>
                  </Badge>
                  
                  <div className="hidden sm:flex items-center gap-2 bg-card/80 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border">
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xs font-medium text-foreground">
                      {locale === 'ar' ? 'محدث' : 'Updated'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
          
          {/* Enhanced Content */}
          <CardContent className="p-4">
            <ChildCards />
          </CardContent>
        </Card>

    
        </div>
      </div>
    </div>
  );
}