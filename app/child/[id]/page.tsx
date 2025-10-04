'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import Link from 'next/link';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import { Person } from '@/types';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import SchoolInfo from './SchoolInfo';
import StreamGrades from './StreamGrades';
import SignConductSection from './components/SignConductSection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import InfoTab from './components/InfoTab';

interface BasicInfoResponse {
  meta: {
    eid: string;
    personSourcedId: string;
    role: string;
    studentCount: number;
  };
  parent: Person[];
  children: Person[];
}

export default function ChildDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const sourcedId = params.id as string;

  // Only send sourcedId, do not send eid (parent EID is taken from session on backend)
  const { data, error, isLoading } = useSWR<BasicInfoResponse>(
    sourcedId ? `/api/oneroster/basic-info-full?sourcedId=${encodeURIComponent(sourcedId)}` : null,
    jsonFetcher
  );
  const [year, setYear] = React.useState<string>(() => String(new Date().getFullYear()));

  if (isLoading) {
    return <LoadingSkeleton locale={locale} />;
  }
  if (error) {
    // If the error object contains a warning from the API, show it
    if (error.warning) {
      return (
        <div className="text-center py-10">
          <div className="mb-4 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-4">
            {error.warning}
          </div>
        </div>
      );
    }
    return <div className="text-center py-10 text-red-600">{t.child.error_loading_child_data}</div>;
  }
  if (data && (data as any).warning) {
    return (
      <div className="text-center py-10">
        <div className="mb-4 text-yellow-700 bg-yellow-100 border border-yellow-300 rounded p-4">
          {(data as any).warning}
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="text-center py-10">{t.child.no_data_available_for_child}</div>;
  }

  const person = data.parent?.[0] || data.children?.[0];
  if (!person) {
    return <div className="text-center py-10">{t.child.child_not_found}</div>;
  }

  const displayName = locale === 'ar'
    ? [person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ')
    : [person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFamilyName].filter(Boolean).join(' ');

  return (
    <div className={clsx("min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30", locale === 'ar' && 'direction-rtl')}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Back Navigation with Breadcrumbs */}
        <nav className="mb-8" aria-label="Breadcrumb">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-all duration-200 hover:bg-blue-50 px-3 py-2 rounded-lg group"
            >
              <svg className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4M16 5v4" />
              </svg>
              {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
            </Link>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
            </svg>
            <span className="text-sm font-medium text-gray-900">
              {locale === 'ar' ? 'ملف الطالب' : 'Student Profile'}
            </span>
          </div>
        </nav>

        {/* Enhanced Header Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white overflow-hidden">
          <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-16">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-black/5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05' fill-rule='nonzero'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Enhanced Avatar */}
              <div className="relative group">
                <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl border border-white/30">
                  <span className="text-5xl font-bold text-white drop-shadow-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
              </div>
              
              <div className="text-center sm:text-left w-full">
                <div className={clsx("flex flex-col sm:flex-row sm:items-start sm:justify-between w-full", locale === 'ar' && 'direction-rtl')}>
                  <div className="flex-1">
                    {/* Enhanced Name and Title */}
                    <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">{displayName}</h1>
                    <p className="text-blue-100 text-lg mb-6 font-medium">{t.child.child_profile}</p>
                    
                    {/* Enhanced Badges */}
                    <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                      <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/30 text-gray-700 shadow-sm hover:bg-white transition-all">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" />
                        </svg>
                        ID: {person.sourcedId}
                      </Badge>
                      <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-white/30 text-gray-700 shadow-sm hover:bg-white transition-all">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {person.role || (locale === 'ar' ? 'طالب' : 'Student')}
                      </Badge>
                      {person.status && (
                        <Badge 
                          variant={person.status === 'active' ? 'default' : 'secondary'} 
                          className={clsx(
                            "shadow-sm hover:scale-105 transition-all",
                            person.status === 'active' 
                              ? "bg-green-500 text-white border-green-400" 
                              : "bg-gray-500 text-white border-gray-400"
                          )}
                        >
                          <div className={clsx("w-2 h-2 rounded-full mr-2", 
                            person.status === 'active' ? 'bg-green-200' : 'bg-gray-200'
                          )}></div>
                          {person.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-0 sm:ml-6 sm:self-start flex-shrink-0">
                    <SignConductSection locale={locale} studentId={person.sourcedId} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>


        {/* Enhanced Tabs Section */}
        <Tabs defaultValue="info" className={clsx("w-full", locale === 'ar' && 'direction-rtl')}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-8">
            <TabsList className="grid w-full grid-cols-5 bg-gray-50 rounded-lg p-1">
              <TabsTrigger 
                value="info" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="hidden sm:inline">{locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}</span>
                <span className="sm:hidden">{locale === 'ar' ? 'معلومات' : 'Info'}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="grades"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">{locale === 'ar' ? 'المراحل الدراسية' : 'Grades'}</span>
                <span className="sm:hidden">{locale === 'ar' ? 'درجات' : 'Grades'}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="attendance"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden sm:inline">{locale === 'ar' ? 'الحضور' : 'Attendance'}</span>
                <span className="sm:hidden">{locale === 'ar' ? 'حضور' : 'Attend'}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="assignments"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">{locale === 'ar' ? 'الواجبات' : 'Assignments'}</span>
                <span className="sm:hidden">{locale === 'ar' ? 'واجبات' : 'Tasks'}</span>
              </TabsTrigger>
              <TabsTrigger 
                value="school"
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="hidden sm:inline">{locale === 'ar' ? 'معلومات المدرسة' : 'School Info'}</span>
                <span className="sm:hidden">{locale === 'ar' ? 'مدرسة' : 'School'}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: Info */}
          <TabsContent value="info" className={clsx("animate-in fade-in-50 duration-300", locale === 'ar' && 'direction-rtl')}>
            <InfoTab person={person} t={t} locale={locale} />
          </TabsContent>

          {/* Tab 2: Grades */}
          <TabsContent value="grades" className="animate-in fade-in-50 duration-300">
            {person?.sourcedId ? (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <StreamGrades studentId={person.sourcedId} />
                </div>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">{locale === 'ar' ? 'هوية الطالب غير متوفرة.' : 'Student ID not available.'}</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Tab 3: Attendance */}
          <TabsContent value="attendance" className="animate-in fade-in-50 duration-300">
            <Card className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {locale === 'ar' ? 'قريبًا' : 'Coming Soon'}
                </h3>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  {locale === 'ar' ? 'سيتم عرض معلومات الحضور والغياب هنا قريبًا.' : 'Attendance tracking and reports will be displayed here soon.'}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 4: Assignments */}
          <TabsContent value="assignments" className="animate-in fade-in-50 duration-300">
            <Card className="p-12">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {locale === 'ar' ? 'قريبًا' : 'Coming Soon'}
                </h3>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                  {locale === 'ar' ? 'سيتم عرض الواجبات والمهام الدراسية هنا قريبًا.' : 'Assignments, homework, and academic tasks will be displayed here soon.'}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Tab 5: School Info */}
          <TabsContent value="school" className="animate-in fade-in-50 duration-300">
            <div className="space-y-6">
              {/* Enhanced Year Selector */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {locale === 'ar' ? 'السنة الدراسية' : 'Academic Year'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {locale === 'ar' ? 'اختر السنة الدراسية لعرض المعلومات' : 'Select academic year to view information'}
                      </p>
                    </div>
                  </div>
                  <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-48 bg-white shadow-sm border-gray-300 hover:border-purple-300 transition-colors">
                      <SelectValue placeholder={locale === 'ar' ? 'اختر السنة' : 'Select year'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="font-medium">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          {locale === 'ar' ? 'كل السنوات' : 'All years'}
                        </div>
                      </SelectItem>
                      {(() => {
                        const current = new Date().getFullYear();
                        const years: number[] = [];
                        for (let y = current + 1; y >= 2017; y--) years.push(y);
                        return years.map((y) => (
                          <SelectItem key={y} value={String(y)} className="font-mono">
                            {String(y)}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              {/* School Information Content */}
              {person?.sourcedId ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <SchoolInfo studentId={person.sourcedId} year={year} />
                </div>
              ) : (
                <Card className="p-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg">{locale === 'ar' ? 'هوية الطالب غير متوفرة.' : 'Student ID not available.'}</p>
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
