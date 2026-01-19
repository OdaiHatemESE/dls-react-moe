'use client';

import type { StudentProfileV1 } from '@/app/types/studentprofile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InfoCard from './InfoCard';

interface InfoTabProps {
  person: StudentProfileV1;
  t: any; // Using 'any' for t function as its type is complex
  locale?: string;
}

export default function InfoTab({ person, t, locale }: InfoTabProps) {
  // Get primary address (marked with isPrimary flag) or fall back to first address
  const primaryAddress = person.addresses?.find(a => a.isPrimary) || person.addresses?.[0];
  
  // Get primary contact email and phone (prefer isPrimary flag, then fallback to first match)
  const primaryEmail = person.contacts?.find(c => c.isPrimary && (c.type === 'Email' || c.type === 'OfficialEmail'))?.value 
    || person.contacts?.find(c => c.type === 'Email' || c.type === 'OfficialEmail')?.value 
    || '';
  const primaryPhone = person.contacts?.find(c => c.isPrimary && c.type === 'Mobile')?.value 
    || person.contacts?.find(c => c.type === 'Mobile')?.value 
    || '';

  return (
    <div className="space-y-8">
      {/* Contact & Identity */}
      <Card className="border-0  bg-white">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
          <CardTitle className="flex items-center">
            <div className="p-3 bg-gray-100 rounded-xl me-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>{t.child.basic_information}</span>
              <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>{t.child.basic_info_subtitle}</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InfoCard 
              label={t.child.given_name} 
              value={locale === 'ar' ? (person.firstNameArabic || '') : (person.firstNameEnglish || '')}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
              highlight={true}
              locale={locale}
            />
            {(person.middleNameArabic || person.middleNameEnglish) && (
              <InfoCard 
                label={t.child.middle_name} 
                value={locale === 'ar' ? (person.middleNameArabic || '') : (person.middleNameEnglish || '')}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                locale={locale}
              />
            )}
            {locale !== 'ar' && person.thirdNameEnglish && (
              <InfoCard 
                label={t.child.third_name} 
                value={person.thirdNameEnglish || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                locale={locale}
              />
            )}
            {locale !== 'ar' && person.fourthNameEnglish && (
              <InfoCard 
                label={t.child.fourth_name} 
                value={person.fourthNameEnglish || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                locale={locale}
              />
            )}
            <InfoCard 
              label={t.child.family_name} 
              value={locale === 'ar' ? (person.lastNameArabic || '') : (person.familyNameEnglish || '')}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              highlight={true}
              locale={locale}
            />
            <InfoCard 
              label={t.child.username} 
              value={person.username || ''}
              locale={locale}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            {person.studentNumber && (
              <InfoCard 
                label={t.child.student_number} 
                value={person.studentNumber || ''}
                locale={locale}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                mono
                highlight={true}
              />
            )}
            <InfoCard 
              label={t.child.identifier} 
              value={person.emirateId || ''}
              locale={locale}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" /></svg>}
            />
            <InfoCard 
              label={t.child.email} 
              value={primaryEmail}
              locale={locale}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
            />
            <InfoCard 
              label={t.child.phone} 
              value={primaryPhone}
              locale={locale}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
            />
            <InfoCard 
              label={t.child.gender} 
              value={person.gender || ''}
              locale={locale}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            />
            {person.religion && (
              <InfoCard 
                label={t.child.religion} 
                value={person.religion || ''}
                locale={locale}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parent/Guardian Information */}
      {person.parent && (
        <Card className="border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-xl me-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>{t.child.parent_info}</span>
                  <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>{t.child.parent_info_subtitle}</p>
                </div>
              </div>
              {person.parent.enabledUser !== undefined && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  person.parent.enabledUser 
                    ? 'bg-green-500/15 border border-green-500/30' 
                    : 'bg-gray-500/15 border border-gray-400/30'
                }`}>
                  <svg className={`w-4 h-4 ${person.parent.enabledUser ? 'text-green-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                    {person.parent.enabledUser ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className={`text-xs font-semibold ${person.parent.enabledUser ? 'text-green-700' : 'text-gray-600'}`}>
                    {person.parent.enabledUser ? t.child.parent_enabled_yes : t.child.parent_enabled_no}
                  </span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent Name */}
              {(person.parent.givenName || person.parent.englishFirstName) && (
                <InfoCard 
                  label={t.child.parent_name} 
                  value={
                    locale === 'ar' 
                      ? [person.parent.givenName, person.parent.middleName, person.parent.familyName].filter(Boolean).join(' ') || 
                        [person.parent.englishFirstName, person.parent.englishSecondName, person.parent.englishThirdName, person.parent.englishFamilyName].filter(Boolean).join(' ')
                      : [person.parent.englishFirstName, person.parent.englishSecondName, person.parent.englishThirdName, person.parent.englishFamilyName].filter(Boolean).join(' ') ||
                        [person.parent.givenName, person.parent.middleName, person.parent.familyName].filter(Boolean).join(' ')
                  }
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                  highlight={true}
                  locale={locale}
                />
              )}
              
              {/* Parent ID */}
              {person.parent.identifier && (
                <InfoCard 
                  label={t.child.parent_id} 
                  value={person.parent.identifier || ''}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-4 0V4a2 2 0 014 0v2" /></svg>}
                  mono
                  locale={locale}
                />
              )}

              {/* Parent Email */}
              {person.parent.contacts && person.parent.contacts.length > 0 && (
                <>
                  {person.parent.contacts.find(c => c.type === 'Email' || c.type === 'OfficialEmail') && (
                    <InfoCard 
                      label={t.child.parent_email} 
                      value={
                        person.parent.contacts?.find(c => c.isPrimary && (c.type === 'Email' || c.type === 'OfficialEmail'))?.value ||
                        person.parent.contacts?.find(c => c.type === 'Email' || c.type === 'OfficialEmail')?.value || 
                        ''
                      }
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                      locale={locale}
                    />
                  )}
                  
                  {/* Parent Phone */}
                  {person.parent.contacts.find(c => c.type === 'Mobile') && (
                    <InfoCard 
                      label={t.child.parent_phone} 
                      value={
                        person.parent.contacts?.find(c => c.isPrimary && c.type === 'Mobile')?.value ||
                        person.parent.contacts?.find(c => c.type === 'Mobile')?.value || 
                        ''
                      }
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                      locale={locale}
                    />
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nationality & Citizenship */}
      {(person.NationalityEN || person.NationalityAR || person.CitizenshipStatus) && (
        <Card className="border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
            <CardTitle className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl me-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>{t.child.nationality_info}</span>
                <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>{t.child.nationality_subtitle}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {person.NationalityEN && (
                <InfoCard 
                  label={t.child.nationality_en} 
                  value={person.NationalityEN || ''}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  highlight={true}
                  locale={locale}
                />
              )}
              {person.NationalityAR && (
                <InfoCard 
                  label={t.child.nationality_ar} 
                  value={person.NationalityAR || ''}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  highlight={true}
                  locale={locale}
                />
              )}
              {person.CitizenshipStatus && (
                <InfoCard 
                  label={t.child.citizenship_status} 
                  value={person.CitizenshipStatus || ''}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                  highlight={true}
                  locale={locale}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Birth Information */}
      {(person.dateOfBirth || person.birthPlaceCityAr || person.birthPlaceCityEn || person.birthPlaceCountryAr || person.birthPlaceCountryEn) && (
        <Card className="border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
            <CardTitle className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-xl me-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>{t.child.birth_info}</span>
                <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>{t.child.birth_info_subtitle}</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {person.dateOfBirth && (
                <InfoCard 
                  label={t.child.birth_date} 
                  value={person.dateOfBirth ? new Date(person.dateOfBirth).toLocaleDateString(locale === 'ar' ? 'ar-AE' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                  locale={locale}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  highlight={true}
                />
              )}
              {(person.birthPlaceCityAr || person.birthPlaceCityEn) && (
                <InfoCard 
                  label={t.child.birth_place_city} 
                  value={locale === 'ar' ? (person.birthPlaceCityAr || person.birthPlaceCityEn || '') : (person.birthPlaceCityEn || person.birthPlaceCityAr || '')}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                  locale={locale}
                />
              )}
              {(person.birthPlaceCountryAr || person.birthPlaceCountryEn) && (
                <InfoCard 
                  label={t.child.birth_place_country} 
                  value={locale === 'ar' ? (person.birthPlaceCountryAr || person.birthPlaceCountryEn || '') : (person.birthPlaceCountryEn || person.birthPlaceCountryAr || '')}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  locale={locale}
                  highlight={true}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

  
      {/* Address */}
      <Card className="border-0  bg-white">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-3 bg-stone-100 rounded-xl me-4">
                <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>{t.child.primary_address}</span>
                <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>{t.child.address_info_subtitle}</p>
              </div>
            </div>
            {primaryAddress?.isPrimary && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-semibold text-primary">
                  {locale === 'ar' ? 'عنوان أساسي' : 'Primary Address'}
                </span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          {primaryAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoCard 
                label={t.child.country} 
                value={primaryAddress.country || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                highlight={true}
                locale={locale}
              />
              <InfoCard 
                label={t.child.state} 
                value={primaryAddress.state || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                locale={locale}
              />
              <InfoCard 
                label={t.child.city} 
                value={primaryAddress.city || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                locale={locale}
                highlight={true}
              />
              <InfoCard 
                label={t.child.zip_code} 
                value={primaryAddress.zipCode?.toString() || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                mono
              />
              <InfoCard 
                label={t.child.po_box} 
                value={primaryAddress.poBox || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
              />
              <InfoCard 
                label={t.child.region} 
                value={primaryAddress.region || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
              />
              <InfoCard 
                label={t.child.sector} 
                value={primaryAddress.sector || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              />
              <InfoCard 
                label={t.child.road_number} 
                value={primaryAddress.roadNumber || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>}
              />
              <InfoCard 
                label={t.child.plot_id} 
                value={primaryAddress.plotId || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                mono
              />
              <InfoCard 
                label={t.child.plot_number} 
                value={primaryAddress.plotNumber || ''}
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>}
                mono
              />
              <div className="md:col-span-2 lg:col-span-3">
                <InfoCard 
                  label={t.child.address_lines} 
                  value={[primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean).join(', ') || ''}
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                  highlight={true}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.child.no_address_title}</h3>
              <p className="text-gray-500 max-w-sm mx-auto">{t.child.no_address_available}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
