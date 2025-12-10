"use client";

import React from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useI18n } from "@/app/i18n/I18nProvider";
import { jsonFetcher } from "@/lib/swr";
import type { StudentProfileV1 } from "@/app/types/studentprofile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApplicationData {
  id: number;
  school_ID: string;
  studentNumber: string;
  primaryPhone: string;
  otherPhone: string;
  transportationType: string;
  emirate: string;
  area: string;
  street: string;
  houseBuilding: string;
  region: string;
  zone: string;
  plot: string;
  mainPlot: string;
  premises: string;
  latitude: string;
  longitude: string;
  attachment01: string;
  stateID: number | null;
  cityID: number | null;
  regionID: number | null;
  sectorID: number | null;
  status_ID: number;
  returnComment: string | null;
  source_ID: string;
  datetime: string;
  m95_Lookups: {
    id: number;
    description: string;
    keys: number;
    parent_ID: number | null;
    listName: string;
    m95_MAIN: any[];
  };
}

interface ApplicationsResponse {
  data: ApplicationData[];
}

export default function MyApplicationsPage() {
  const { t, locale } = useI18n();
  const { data: session } = useSession();
  const eid = session?.user?.emiratesId as string | undefined;

  // Fetch children data
  const childrenKey = eid ? `/api/PP/ChildList/${encodeURIComponent(eid)}` : null;
  const { data: childrenData, isLoading: isLoadingChildren } = useSWR<any>(
    childrenKey,
    jsonFetcher
  );
  const children = childrenData?.students ?? [];

  // Extract source IDs from children
  const sourceIds = React.useMemo(() => {
    return children
      .map((child: StudentProfileV1) => child.id)
      .filter(Boolean);
  }, [children]);

  // Fetch applications data using the new API
  const shouldFetch = sourceIds.length > 0;
  const { data: applicationsData, isLoading: isLoadingApplications, error } = useSWR<ApplicationsResponse>(
    shouldFetch ? ['/api/PP/myapplications', sourceIds] : null,
    async ([url, ids]) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceIds: ids }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch applications: ${response.statusText}`);
      }
      
      return response.json();
    }
  );

  const applications = applicationsData?.data ?? [];

  // Create a map of applications by source_ID for easy lookup
  const applicationsMap = React.useMemo(() => {
    const map = new Map<string, ApplicationData>();
    applications.forEach((app) => {
      map.set(app.source_ID, app);
    });
    return map;
  }, [applications]);

  type ChildWithApplication = {
    child: StudentProfileV1;
    application: ApplicationData | null;
  };

  // Combine children with their application data - only include students with applications
  const childrenWithApplications = React.useMemo<ChildWithApplication[]>(() => {
    return children
      .map((child: StudentProfileV1) => ({
        child,
        application: applicationsMap.get(child.id) || null,
      }))
      .filter(({ application }: ChildWithApplication) => application !== null);
  }, [children, applicationsMap]);

  const isLoading = isLoadingChildren || isLoadingApplications;

  // Get status badge variant
  const getStatusVariant = (statusId: number): "default" | "secondary" | "destructive" | "outline" => {
    switch (statusId) {
      case 1:
        return "default"; // In progress
      case 2:
        return "destructive"; // Returned
      case 3:
        return "secondary"; // Completed
      case 4:
        return "outline"; // Accepted
      case 5:
        return "outline"; // Rejected
      default:
        return "outline";
    }
  };

  // Get localized status text
  const getStatusText = (statusId: number): string => {
    const statusMap: Record<number, { ar: string; en: string }> = {
      1: { ar: 'قيد الإجراء', en: 'In Progress' },
      2: { ar: 'مرتجع', en: 'Returned' },
      3: { ar: 'تم التعديل', en: 'Modified' },
      4: { ar: 'مقبول', en: 'Accepted' },
      5: { ar: 'مرفوض', en: 'Rejected' },
    };
    
    const status = statusMap[statusId];
    return status ? (locale === 'ar' ? status.ar : status.en) : (locale === 'ar' ? 'غير معروف' : 'Unknown');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-foreground">
            {locale === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
          <p className="text-sm text-muted-foreground">
            {locale === 'ar' ? 'نقوم بجلب بيانات الطلبات' : 'Fetching applications data'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center">
              <svg className="w-16 h-16 text-destructive mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-destructive mb-2">
                {locale === 'ar' ? 'حدث خطأ' : 'Error Occurred'}
              </h3>
              <p className="text-muted-foreground">
                {error.message || (locale === 'ar' ? 'فشل تحميل البيانات' : 'Failed to load data')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Header */}


      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm opacity-90 mb-1">
                    {locale === 'ar' ? 'إجمالي الطلبات' : 'Total Applications'}
                  </p>
                  <p className="text-3xl font-bold">{applications.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm opacity-90 mb-1">
                    {locale === 'ar' ? 'قيد الإجراء' : 'In Progress'}
                  </p>
                  <p className="text-3xl font-bold">
                    {applications.filter(app => app.status_ID === 1).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className={`flex items-center justify-between ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
                  <p className="text-sm opacity-90 mb-1">
                    {locale === 'ar' ? 'الطلاب بطلبات' : 'Students with Applications'}
                  </p>
                  <p className="text-3xl font-bold">{childrenWithApplications.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span>{locale === 'ar' ? 'تفاصيل الطلبات' : 'Application Details'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? '#' : 'ID'}
                    </TableHead>
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'اسم الطالب' : 'Student Name'}
                    </TableHead>
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'رقم الطالب' : 'Student Number'}
                    </TableHead>
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'الحالة' : 'Status'}
                    </TableHead>
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'التعليق' : 'Comment'}
                    </TableHead>
                    <TableHead className={`font-bold ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                      {locale === 'ar' ? 'التاريخ' : 'Date'}
                    </TableHead>
                    <TableHead className="font-bold text-center">
                      {locale === 'ar' ? 'الإجراء' : 'Action'}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {childrenWithApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-foreground mb-1">
                              {locale === 'ar' ? 'لا توجد طلبات' : 'No applications found'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {locale === 'ar' ? 'لا توجد طلبات مسجلة لأطفالك حالياً' : 'No applications registered for your children at the moment'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    childrenWithApplications.map(({ child, application }: ChildWithApplication, index: number) => {
                      const displayName = locale === 'ar'
                        ? [child.firstNameArabic, child.middleNameArabic, child.lastNameArabic]
                            .filter(Boolean)
                            .join(' ')
                        : [
                            child.firstNameEnglish,
                            child.middleNameEnglish,
                            child.thirdNameEnglish,
                            child.fourthNameEnglish,
                            child.familyNameEnglish,
                          ]
                            .filter(Boolean)
                            .join(' ');

                      return (
                        <TableRow key={child.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className={`font-medium ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                            {application?.id || index + 1}
                          </TableCell>
                          <TableCell className={locale === 'ar' ? 'text-right' : 'text-left'}>
                            <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row' : ''}`}>
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                <p className="text-xs text-muted-foreground">{child.emirateId}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className={locale === 'ar' ? 'text-right' : 'text-left'}>
                            <Badge variant="outline" className="font-mono">
                              {application!.studentNumber || child.studentNumber || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className={locale === 'ar' ? 'text-right' : 'text-left'}>
                            <Badge variant={getStatusVariant(application!.status_ID)}>
                              {getStatusText(application!.status_ID)}
                            </Badge>
                          </TableCell>
                          <TableCell className={locale === 'ar' ? 'text-right' : 'text-left'}>
                            {application!.returnComment ? (
                              <div className="max-w-xs">
                                <p className={`text-sm text-muted-foreground line-clamp-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`} title={application!.returnComment}>
                                  {application!.returnComment}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">-</span>
                            )}
                          </TableCell>
                          <TableCell className={locale === 'ar' ? 'text-right' : 'text-left'}>
                            <span className="text-sm text-muted-foreground">
                              {new Date(application!.datetime).toLocaleDateString(
                                locale === 'ar' ? 'ar-AE' : 'en-US',
                                {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            {application!.status_ID === 2 && (
                              <Button
                                asChild
                                size="sm"
                                variant="outline"
                                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30"
                              >
                                <a href={`/child/${child.id}/update-info?mode=resubmit`}>
                                  {locale === 'ar' ? 'إعادة تقديم' : 'Resubmit'}
                                </a>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        {applications.length > 0 && (
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              {locale === 'ar'
                ? `آخر تحديث: ${new Date().toLocaleString('ar-AE')}`
                : `Last updated: ${new Date().toLocaleString('en-US')}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
