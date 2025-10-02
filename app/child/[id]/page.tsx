'use client';


import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { Person } from '@/types';
import { jsonFetcher } from '@/lib/swr';

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
  const params = useParams();
  const eid = params.id as string;
  const { data, error, isLoading } = useSWR<BasicInfoResponse>(
    eid ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}` : null,
    jsonFetcher
  );

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading child data.</div>;
  }
  if (!data) {
    return <div className="text-center py-10">No data available for this child.</div>;
  }

  const person = data.parent?.[0] || data.children?.[0];
  if (!person) {
    return <div className="text-center py-10">Child not found.</div>;
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
        <p className="text-gray-500 text-base">Child Profile</p>
      </div>

      <div className="space-y-8">
        {/* Contact & Identity */}
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-7 8-7s8 3 8 7" /></svg>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Given Name</div>
              <div className="text-base text-gray-900 font-medium">{person.givenName || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Family Name</div>
              <div className="text-base text-gray-900 font-medium">{person.familyName || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Username</div>
              <div className="text-base text-gray-900">{person.username || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Identifier</div>
              <div className="text-base text-gray-900">{person.identifier || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Email</div>
              <div className="text-base text-gray-900">{person.email || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Phone</div>
              <div className="text-base text-gray-900">{person.phone || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Role</div>
              <div className="text-base text-gray-900">{person.role || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-base text-gray-900">{person.status || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Sourced ID</div>
              <div className="text-base text-gray-900 font-mono text-sm">{person.sourcedId}</div>
            </div>
            {person.dateLastModified && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Last Modified</div>
                <div className="text-base text-gray-900">{new Date(person.dateLastModified).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </div>

        {/* Demographics & Names */}
        <div className="rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Demographics & Names</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Gender</div>
              <div className="text-base text-gray-900">{person.metadata?.gender || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Birth Date</div>
              <div className="text-base text-gray-900">{person.metadata?.birthDate ? new Date(person.metadata?.birthDate).toLocaleDateString() : '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Nationality (EN)</div>
              <div className="text-base text-gray-900">{person.metadata?.nationality || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Nationality (AR)</div>
              <div className="text-base text-gray-900">{person.metadata?.nationalityArabic || '-'}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1">Arabic Name</div>
              <div className="text-base text-gray-900">{[person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ') || '-'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">English Name</div>
              <div className="text-base text-gray-900">{[person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFourthName, person.metadata?.englishFamilyName].filter(Boolean).join(' ') || '-'}</div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Primary Address</h2>
          {primaryAddress ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Country</div>
                <div className="text-base text-gray-900">{primaryAddress.country || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">State</div>
                <div className="text-base text-gray-900">{primaryAddress.state || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">City</div>
                <div className="text-base text-gray-900">{primaryAddress.city || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">ZIP Code</div>
                <div className="text-base text-gray-900">{primaryAddress.zipCode || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">PO Box</div>
                <div className="text-base text-gray-900">{primaryAddress.poBox || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Region</div>
                <div className="text-base text-gray-900">{primaryAddress.region || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Sector</div>
                <div className="text-base text-gray-900">{primaryAddress.sector || '-'}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-xs text-gray-500 mb-1">Address Lines</div>
                <div className="text-base text-gray-900">{[primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean).join(', ') || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Road Number</div>
                <div className="text-base text-gray-900">{primaryAddress.roadNumber || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Plot Id</div>
                <div className="text-base text-gray-900">{primaryAddress.plotId || '-'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Plot Number</div>
                <div className="text-base text-gray-900">{primaryAddress.plotNumber || '-'}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500">No address available</div>
          )}
        </div>
      </div>
    </div>
  );
}
