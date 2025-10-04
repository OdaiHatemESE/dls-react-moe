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
    <div className={clsx("max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6", locale === 'ar' && 'direction-rtl')}>
      {/* Back Navigation */}
      <div className="mb-6">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {locale === 'ar' ? 'العودة إلى لوحة التحكم' : 'Back to Dashboard'}
        </Link>
      </div>

      {/* Header Card */}
      <Card className="mb-8 border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-blue-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center sm:text-left w-full">
              <div  className={clsx("flex flex-col sm:flex-row sm:items-start sm:justify-between w-full", locale === 'ar' && 'direction-rtl')}>
                <div className="flex-1" >
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                  <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    <Badge variant="outline" className="bg-white">
                      ID: {person.sourcedId}
                    </Badge>
                    <Badge variant="outline" className="bg-white">
                      {person.role || (locale === 'ar' ? 'طالب' : 'Student')}
                    </Badge>
                    {person.status && (
                      <Badge variant={person.status === 'active' ? 'default' : 'secondary'} className="bg-white">
                        {person.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-600 mt-3">{t.child.child_profile}</p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-6 sm:self-start flex-shrink-0 flex justify-center sm:justify-end">
                  <SignConductSection locale={locale} studentId={person.sourcedId} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>


      {/* Tabs Section */}
      <Tabs defaultValue="info"  className={clsx("w-full", locale === 'ar' && 'direction-rtl')} >
        <TabsList className="mb-4">
          <TabsTrigger value="info">{locale === 'ar' ? 'المعلومات الأساسية' : 'Basic Info'}</TabsTrigger>
          <TabsTrigger value="grades">{locale === 'ar' ? 'المراحل الدراسية' : 'Grades'}</TabsTrigger>
          <TabsTrigger value="attendance">{locale === 'ar' ? 'الحضور' : 'Attendance'}</TabsTrigger>
          <TabsTrigger value="assignments">{locale === 'ar' ? 'الواجبات' : 'Assignments'}</TabsTrigger>
          <TabsTrigger value="school">{locale === 'ar' ? 'معلومات المدرسة' : 'School Info'}</TabsTrigger>
        </TabsList>

        {/* Tab 1: Info */}
        <TabsContent value="info" className={clsx( locale === 'ar' && 'direction-rtl')} >
          <InfoTab person={person} t={t} locale={locale} />
        </TabsContent>

        {/* Tab 2: Grades */}
        <TabsContent value="grades">
          {person?.sourcedId ? (
            <div className="space-y-4">
              <StreamGrades studentId={person.sourcedId} />
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">
              {locale === 'ar' ? 'هوية الطالب غير متوفرة.' : 'Student ID not available.'}
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Attendance */}
        <TabsContent value="attendance">
          <div className="py-8 text-center text-gray-500">
            {locale === 'ar' ? 'سيتم عرض الحضور هنا قريبًا.' : 'Attendance will be displayed here soon.'}
          </div>
        </TabsContent>

        {/* Tab 4: Assignments */}
        <TabsContent value="assignments">
          <div className="py-8 text-center text-gray-500">
            {locale === 'ar' ? 'سيتم عرض الواجبات هنا قريبًا.' : 'Assignments will be displayed here soon.'}
          </div>
        </TabsContent>

        {/* Tab 5: School Info */}
        <TabsContent value="school">
          <div className="mb-4 flex items-center gap-3">
            <div className="text-sm text-gray-600">
              {locale === 'ar' ? 'السنة الدراسية:' : 'School Year:'}
            </div>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-40 bg-white">
                <SelectValue placeholder={locale === 'ar' ? 'اختر السنة' : 'Select year'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{locale === 'ar' ? 'كل السنوات' : 'All years'}</SelectItem>
                {(() => {
                  const current = new Date().getFullYear();
                  const years: number[] = [];
                  for (let y = current + 1; y >= 2017; y--) years.push(y);
                  return years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {String(y)}
                    </SelectItem>
                  ));
                })()}
              </SelectContent>
            </Select>
          </div>
          {/* Determine student sourcedId to pass */}
          {person?.sourcedId ? (
            <SchoolInfo studentId={person.sourcedId} year={year} />
          ) : (
            <div className="text-center py-8 text-gray-600">{locale === 'ar' ? 'هوية الطالب غير متوفرة.' : 'Student ID not available.'}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
