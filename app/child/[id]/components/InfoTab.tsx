'use client';

import { Person } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import InfoCard from './InfoCard';

interface InfoTabProps {
  person: Person;
  t: any; // Using 'any' for t function as its type is complex
  locale?: string;
}

export default function InfoTab({ person, t, locale }: InfoTabProps) {
  const primaryAddress = person.metadata?.addresses?.[0];

  return (
    <div className="space-y-8">
      {/* Contact & Identity */}
      <Card className="border border-gray-200">
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
      <Card className="border border-gray-200">
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
              value={person.metadata?.birthDate ? new Date(person.metadata.birthDate).toLocaleDateString() : '-'} 
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
      <Card className="border border-gray-200">
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
    </div>
  );
}
