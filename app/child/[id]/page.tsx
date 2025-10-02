'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Person } from '@/types';
import { jsonFetcher } from '@/lib/swr';
import { useI18n } from '@/app/i18n/I18nProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import clsx from 'clsx';

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

// Helper component for info display
const InfoCard = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="text-xs text-gray-500 mb-1 font-medium">{label}</div>
    <div className={clsx("text-sm text-gray-900 font-semibold", mono && "font-mono")}>{value}</div>
  </div>
);


export default function ChildDetailPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const eid = params.id as string;
  const { data, error, isLoading } = useSWR<BasicInfoResponse>(
    eid ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}` : null,
    jsonFetcher
  );

  if (isLoading) {
    return <div className="text-center py-10">{t.child.loading}</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">{t.child.error_loading_child_data}</div>;
  }
  if (!data) {
    return <div className="text-center py-10">{t.child.no_data_available_for_child}</div>;
  }

  const person = data.parent?.[0] || data.children?.[0];
  if (!person) {
    return <div className="text-center py-10">{t.child.child_not_found}</div>;
  }

  const primaryAddress = person.metadata?.addresses?.[0];

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
      <Card className="mb-8 border-0 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-blue-600">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center sm:text-left">
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
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        {/* Contact & Identity */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-blue-50 border-b border-blue-100">
            <CardTitle className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <span className="text-gray-900">{t.child.basic_information}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard 
                label={t.child.given_name} 
                value={locale === 'ar' ? (person.givenName || '-') : (person.metadata?.englishFirstName || '-')} 
              />
              <InfoCard 
                label={t.child.family_name} 
                value={locale === 'ar' ? (person.familyName || '-') : (person.metadata?.englishFamilyName || '-')} 
              />
              <InfoCard label={t.child.username} value={person.username || '-'} />
              <InfoCard label={t.child.identifier} value={person.identifier || '-'} />
              <InfoCard label={t.child.email} value={person.email || '-'} />
              <InfoCard label={t.child.phone} value={person.phone || '-'} />
              <InfoCard label={t.child.role} value={person.role || '-'} />
              <InfoCard label={t.child.status} value={person.status || '-'} />
              <InfoCard label={t.child.sourced_id} value={person.sourcedId} mono />
              {person.dateLastModified && (
                <InfoCard 
                  label={t.child.last_modified} 
                  value={new Date(person.dateLastModified).toLocaleDateString()} 
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demographics & Names */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-gray-900">{t.child.demographics_and_names}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard 
                label={t.child.gender} 
                value={person.metadata?.gender || '-'} 
              />
              <InfoCard 
                label={t.child.birth_date} 
                value={person.metadata?.birthDate ? new Date(person.metadata?.birthDate).toLocaleDateString() : '-'} 
              />
              <InfoCard 
                label={t.child.nationality_en} 
                value={person.metadata?.nationality || '-'} 
              />
              <InfoCard 
                label={t.child.nationality_ar} 
                value={person.metadata?.nationalityArabic || '-'} 
              />
              <div className="md:col-span-2 lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard 
                    label={t.child.arabic_name} 
                    value={[person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ') || '-'} 
                  />
                  <InfoCard 
                    label={t.child.english_name} 
                    value={[person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFourthName, person.metadata?.englishFamilyName].filter(Boolean).join(' ') || '-'} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-purple-50 border-b border-purple-100">
            <CardTitle className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-gray-900">{t.child.primary_address}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {primaryAddress ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InfoCard label={t.child.country} value={primaryAddress.country || '-'} />
                <InfoCard label={t.child.state} value={primaryAddress.state || '-'} />
                <InfoCard label={t.child.city} value={primaryAddress.city || '-'} />
                <InfoCard label={t.child.zip_code} value={primaryAddress.zipCode || '-'} />
                <InfoCard label={t.child.po_box} value={primaryAddress.poBox || '-'} />
                <InfoCard label={t.child.region} value={primaryAddress.region || '-'} />
                <InfoCard label={t.child.sector} value={primaryAddress.sector || '-'} />
                <InfoCard label={t.child.road_number} value={primaryAddress.roadNumber || '-'} />
                <InfoCard label={t.child.plot_id} value={primaryAddress.plotId || '-'} />
                <InfoCard label={t.child.plot_number} value={primaryAddress.plotNumber || '-'} />
                <div className="md:col-span-2 lg:col-span-3">
                  <InfoCard 
                    label={t.child.address_lines} 
                    value={[primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean).join(', ') || '-'} 
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">{t.child.no_address_available}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions Card */}
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="bg-gray-50 border-b border-gray-100">
            <CardTitle className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg mr-3">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-gray-900">{locale === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/calendar" className="group">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{locale === 'ar' ? 'عرض التقويم' : 'View Calendar'}</p>
                      <p className="text-xs text-gray-500">{locale === 'ar' ? 'الأحداث والمواعيد المهمة' : 'Important events and dates'}</p>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link href="/announcements" className="group">
                <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{locale === 'ar' ? 'عرض الإعلانات' : 'View Announcements'}</p>
                      <p className="text-xs text-gray-500">{locale === 'ar' ? 'آخر الأخبار والإعلانات' : 'Latest news and updates'}</p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
