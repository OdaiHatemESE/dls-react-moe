'use client';



import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Person } from '@/types';
import { jsonFetcher } from '@/lib/swr';
import { useI18n } from '@/app/i18n/I18nProvider';

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
  const { t } = useI18n();
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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <span className="w-24 h-24 rounded-full border-4 border-blue-100 shadow flex items-center justify-center bg-white">
          {/* You can use a child icon here if available */}
          <svg className="w-20 h-20 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">{person.givenName} {person.familyName}</h1>
  <p className="text-gray-500 text-base">{t.child.child_profile}</p>
      </div>

      <div className="space-y-8">
        {/* Contact & Identity */}
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>
            {t.child.basic_information}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.given_name}</div>
              <div className="text-base text-gray-900 font-medium">{person.givenName || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.family_name}</div>
              <div className="text-base text-gray-900 font-medium">{person.familyName || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.username}</div>
              <div className="text-base text-gray-900">{person.username || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.identifier}</div>
              <div className="text-base text-gray-900">{person.identifier || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.email}</div>
              <div className="text-base text-gray-900">{person.email || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.phone}</div>
              <div className="text-base text-gray-900">{person.phone || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.role}</div>
              <div className="text-base text-gray-900">{person.role || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.status}</div>
              <div className="text-base text-gray-900">{person.status || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.sourced_id}</div>
              <div className="text-base text-gray-900 font-mono text-sm">{person.sourcedId}</div>
            </div>
            {person.dateLastModified && (
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.last_modified}</div>
                <div className="text-base text-gray-900">{new Date(person.dateLastModified).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Demographics & Names */}
        <div className="rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t.child.demographics_and_names}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.gender}</div>
              <div className="text-base text-gray-900">{person.metadata?.gender || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.birth_date}</div>
              <div className="text-base text-gray-900">{person.metadata?.birthDate ? new Date(person.metadata?.birthDate).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.nationality_en}</div>
              <div className="text-base text-gray-900">{person.metadata?.nationality || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.nationality_ar}</div>
              <div className="text-base text-gray-900">{person.metadata?.nationalityArabic || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.arabic_name}</div>
              <div className="text-base text-gray-900">{[person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ') || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">{t.child.english_name}</div>
              <div className="text-base text-gray-900">{[person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFourthName, person.metadata?.englishFamilyName].filter(Boolean).join(' ') || '-'}</div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">{t.child.primary_address}</h2>
          {primaryAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.country}</div>
                <div className="text-base text-gray-900">{primaryAddress.country || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.state}</div>
                <div className="text-base text-gray-900">{primaryAddress.state || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.city}</div>
                <div className="text-base text-gray-900">{primaryAddress.city || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.zip_code}</div>
                <div className="text-base text-gray-900">{primaryAddress.zipCode || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.po_box}</div>
                <div className="text-base text-gray-900">{primaryAddress.poBox || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.region}</div>
                <div className="text-base text-gray-900">{primaryAddress.region || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.sector}</div>
                <div className="text-base text-gray-900">{primaryAddress.sector || '-'}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-xs text-gray-500 mb-1">{t.child.address_lines}</div>
                <div className="text-base text-gray-900">{[primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean).join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.road_number}</div>
                <div className="text-base text-gray-900">{primaryAddress.roadNumber || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.plot_id}</div>
                <div className="text-base text-gray-900">{primaryAddress.plotId || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">{t.child.plot_number}</div>
                <div className="text-base text-gray-900">{primaryAddress.plotNumber || '-'}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">{t.child.no_address_available}</div>
          )}
        </div>
      </div>
    </div>
  );
}
