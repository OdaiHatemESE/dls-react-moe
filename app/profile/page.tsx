"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  EditIcon,
  SettingsIcon,
  CheckIcon,
  LoadingIcon
} from '../components/icons';
import { ProfileIcon } from '../components/icons';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { Person } from '@/types';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

export default function ProfilePage() {
  const { t, locale } = useI18n();

  // Get session to extract EID (external identifier)
  const { data: session } = useSession();
  // You may need to adjust this depending on your session shape
  // Use emiratesId or id from session.user for EID

  const eid = session?.user?.emiratesId || session?.user?.id || session?.user?.email;

  // SWR fetcher for API
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  // Fetch parent and children info from API
  const { data, error, isLoading } = useSWR(
    eid ? `/api/oneroster/basic-info-full?eid=${encodeURIComponent(eid)}` : null,
    fetcher
  );

  // Extract parent and children from API response
  const person: Person | undefined = Array.isArray(data?.parent) ? data?.parent[0] : undefined;
  const children: any[] = data?.children || [];

  const getPrimaryEmail = (p: Person): string => {
    if (p.email && p.email.length) return p.email;
    const fromContacts = p.metadata?.contacts?.find(
      (c) => typeof c.contactType === 'string' && c.contactType.toLowerCase().includes('email') && !!c.value
    )?.value;
    return fromContacts ?? '';
  };

  const getPrimaryPhone = (p: Person): string => {
    if (p.phone && p.phone.length) return p.phone;
    if (p.sms && p.sms.length) return p.sms;
    const fromContacts = p.metadata?.contacts?.find(
      (c) => typeof c.contactType === 'string' && c.contactType.toLowerCase().includes('mobile') && !!c.value
    )?.value;
    return fromContacts ?? '';
  };

  const getDisplayName = (p: Person, lng: string): string => {
    if (lng === 'ar') {
      // Prefer Arabic given/family if present
      const parts = [p.givenName, p.familyName].filter(Boolean) as string[];
      if (parts.length) return parts.join(' ');
    }
    // Fallback to English metadata names
    const enParts = [
      p.metadata?.englishFirstName,
      p.metadata?.englishSecondName,
      p.metadata?.englishThirdName,
      p.metadata?.englishFamilyName,
    ].filter(Boolean) as string[];
    if (enParts.length) return enParts.join(' ');
    // Last resort
    return p.username || p.identifier || p.sourcedId;
  };
  type ProfileForm = {
    // Display basics
    name: string;
    email: string;
    phone: string;
    // Arabic names
    arabicGivenName: string;
    arabicMiddleName: string;
    arabicFamilyName: string;
    // English names
    englishFirstName: string;
    englishSecondName: string;
    englishThirdName: string;
    englishFourthName: string;
    englishFamilyName: string;
    // Identity
    identifier: string;
    username: string;
    role: string;
    status: string;
    type: string;
    enabledUser: string;
    // Demographics
    gender: string;
    birthDate: string;
    maritalStatus: string;
    religion: string;
    nationality: string;
    nationalityArabic: string;
    birthCountry: string;
    birthCountryArabic: string;
    birthCity: string;
    englishBirthCity: string;
    // Address (primary)
    address_country: string;
    address_state: string;
    address_city: string;
    address_zipCode: string;
    address_poBox: string;
    address_region: string;
    address_sector: string;
    address_addressLine1: string;
    address_addressLine2: string;
    address_addressLine3: string;
    address_roadNumber: string;
    address_plotId: string;
    address_plotNumber: string;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Preferences and children state (initialize from API if available)
  const [profileData, setProfileData] = useState<any>({
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: false,
    },
    children: [],
    avatar: '/avatar.svg',
  });

  React.useEffect(() => {
    if (person) {
      setProfileData((prev: any) => ({
        ...prev,
        avatar: person?.metadata?.avatar || '/avatar.svg',
        children: children.map((child: any) => ({
          id: child.sourcedId,
          name: [child.metadata?.englishFirstName, child.metadata?.englishFamilyName].filter(Boolean).join(' '),
          avatar: child.metadata?.avatar || '/avatar.svg',
          grade: child.grades || '-',
          teacher: child.metadata?.homeroomTeacher || '-',
        })),
      }));
    }
  }, [person, children]);


  // Compute initial form from API data
  const primaryAddress = person?.metadata?.addresses?.[0];
  const initialForm: ProfileForm = React.useMemo(() => ({
    name: person ? getDisplayName(person, locale) : '',
    email: person ? getPrimaryEmail(person) : '',
    phone: person ? getPrimaryPhone(person) : '',
    arabicGivenName: person?.givenName ?? '',
    arabicMiddleName: person?.middleName ?? '',
    arabicFamilyName: person?.familyName ?? '',
    englishFirstName: person?.metadata?.englishFirstName ?? '',
    englishSecondName: person?.metadata?.englishSecondName ?? '',
    englishThirdName: person?.metadata?.englishThirdName ?? '',
    englishFourthName: person?.metadata?.englishFourthName ?? '',
    englishFamilyName: person?.metadata?.englishFamilyName ?? '',
    identifier: person?.identifier ?? '',
    username: person?.username ?? '',
    role: person?.role ?? '',
    status: person?.status ?? '',
    type: person?.type ?? '',
    enabledUser: typeof person?.enabledUser === 'boolean' ? String(person?.enabledUser) : (person?.enabledUser ?? ''),
    gender: person?.metadata?.gender ?? '',
    birthDate: person?.metadata?.birthDate ?? '',
    maritalStatus: person?.metadata?.maritalStatus ?? '',
    religion: person?.metadata?.religion ?? '',
    nationality: person?.metadata?.nationality ?? '',
    nationalityArabic: person?.metadata?.nationalityArabic ?? '',
    birthCountry: person?.metadata?.birthCountry ?? '',
    birthCountryArabic: person?.metadata?.birthCountryArabic ?? '',
    birthCity: person?.metadata?.birthCity ?? '',
    englishBirthCity: person?.metadata?.englishBirthCity ?? '',
    address_country: primaryAddress?.country ?? '',
    address_state: primaryAddress?.state ?? '',
    address_city: primaryAddress?.city ?? '',
    address_zipCode: primaryAddress?.zipCode ?? '',
    address_poBox: primaryAddress?.poBox ?? '',
    address_region: primaryAddress?.region ?? '',
    address_sector: primaryAddress?.sector ?? '',
    address_addressLine1: primaryAddress?.addressLine1 ?? '',
    address_addressLine2: primaryAddress?.addressLine2 ?? '',
    address_addressLine3: primaryAddress?.addressLine3 ?? '',
    address_roadNumber: primaryAddress?.roadNumber ?? '',
    address_plotId: primaryAddress?.plotId ?? '',
    address_plotNumber: primaryAddress?.plotNumber ?? '',
  }), [person, locale, primaryAddress]);

  const [formData, setFormData] = useState<ProfileForm>(initialForm);
  React.useEffect(() => {
    setFormData(initialForm);
  }, [initialForm]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...initialForm });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setProfileData(prev => ({
        ...prev,
        ...formData
      }));
      setIsEditing(false);
      setIsSaving(false);
      alert(t.profile.updatedSuccess);
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePreferenceChange = (key: keyof typeof profileData.preferences) => {
    setProfileData((prev: any) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: !prev.preferences[key],
      },
    }));
  };

  if (isLoading) {
    return <div className="text-center py-10">Loading...</div>;
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading profile data.</div>;
  }
  if (!person) {
    return <div className="text-center py-10">No profile data found.</div>;
  }

  return (
    <div className={clsx("max-w-5xl mx-auto px-4 sm:px-8 py-10", locale === 'ar' && 'direction-rtl')}>
      {/* Header */}
      <div className="flex flex-col items-center mb-10">
        <span className="w-24 h-24 rounded-full border-4 border-blue-100 shadow flex items-center justify-center bg-white">
          <ProfileIcon className="w-20 h-20 text-blue-400" weight="duotone" />
        </span>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">{formData.name}</h1>
        <p className="text-gray-500 text-base">{t.profile.parentAccount}</p>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
            className="flex items-center gap-2 mt-3"
          >
            <EditIcon className="w-4 h-4" />
            <span>{t.profile.edit}</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact & Identity */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ProfileIcon className="w-5 h-5" />
                {t.profile.personalInfo}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t.profile.emailAddress}</div>
                  <div className="text-base text-gray-900 font-medium">{formData.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">{t.profile.phoneNumber}</div>
                  <div className="text-base text-gray-900 font-medium">{formData.phone}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Identifier</div>
                  <div className="text-base text-gray-900">{person.identifier || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Username</div>
                  <div className="text-base text-gray-900">{person.username || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Role</div>
                  <div className="text-base text-gray-900">{person.role || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <div className="text-base text-gray-900">{person.status || '-'}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics & Names */}
          <Card>
            <CardHeader>
              <CardTitle>Demographics & Names</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Gender</div>
                  <div className="text-base text-gray-900">{person.metadata?.gender || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Birth Date</div>
                  <div className="text-base text-gray-900">{person.metadata?.birthDate || '-'}</div>
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
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle>Primary Address</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Children */}
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.linkedChildren}</CardTitle>
              <p className="text-sm text-gray-600">{t.profile.linkedChildrenSubtitle}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileData.children.length === 0 && (
                  <div className="text-gray-500">No linked children</div>
                )}
                {profileData.children.map((child: any) => (
                  <div key={child.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className={clsx("flex items-center space-x-3", locale === 'ar' && 'space-x-reverse')}>
                      <span className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50">
                        <ProfileIcon className="w-7 h-7 text-blue-400" weight="duotone" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{child.name}</p>
                        <p className="text-xs text-gray-500">{child.grade} • {child.teacher}</p>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                      {t.profile.active}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences & Actions */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SettingsIcon className="w-5 h-5 me-2" />
                {t.profile.notificationPreferences}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.emailNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.emailNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('emailNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.emailNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.smsNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.smsNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('smsNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.smsNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.profile.pushNotifications}</p>
                    <p className="text-xs text-gray-500">{t.profile.pushNotificationsDesc}</p>
                  </div>
                  <button
                    onClick={() => handlePreferenceChange('pushNotifications')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      profileData.preferences.pushNotifications ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={profileData.preferences.pushNotifications}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        profileData.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.profile.accountActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.changePassword}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.privacySettings}
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  {t.profile.downloadData}
                </Button>
                <hr className="my-4" />
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" size="sm">
                  {t.profile.deactivateAccount}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}