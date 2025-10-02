"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ProfileIcon, 
  EditIcon,
  SettingsIcon,
  CheckIcon,
  LoadingIcon
} from '../components/icons';
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
    avatar: '/file.svg',
  });

  React.useEffect(() => {
    if (person) {
      setProfileData((prev: any) => ({
        ...prev,
        avatar: person?.metadata?.avatar || '/file.svg',
        children: children.map((child: any) => ({
          id: child.sourcedId,
          name: [child.metadata?.englishFirstName, child.metadata?.englishFamilyName].filter(Boolean).join(' '),
          avatar: child.metadata?.avatar || '/file.svg',
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
    <div className={clsx("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8", locale === 'ar' && 'direction-rtl')}>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t.profile.title}</h1>
        <p className="mt-1 text-sm text-gray-600">{t.profile.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <ProfileIcon className="w-5 h-5 me-2" />
                  {t.profile.personalInfo}
                </CardTitle>
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className={clsx("flex items-center gap-2")}
                  >
                    <EditIcon className="w-4 h-4" />
                    <span>{t.profile.edit}</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.fullName}
                    </label>
                    <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.emailAddress}
                    </label>
                    <Input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      {t.profile.phoneNumber}
                    </label>
                    <Input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                  </div>

                  {/* Arabic Names */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.fullName} (AR) - First</label>
                      <Input name="arabicGivenName" value={formData.arabicGivenName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.fullName} (AR) - Middle</label>
                      <Input name="arabicMiddleName" value={formData.arabicMiddleName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t.profile.fullName} (AR) - Family</label>
                      <Input name="arabicFamilyName" value={formData.arabicFamilyName} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* English Names */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First (EN)</label>
                      <Input name="englishFirstName" value={formData.englishFirstName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Second (EN)</label>
                      <Input name="englishSecondName" value={formData.englishSecondName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Third (EN)</label>
                      <Input name="englishThirdName" value={formData.englishThirdName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fourth (EN)</label>
                      <Input name="englishFourthName" value={formData.englishFourthName} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Family (EN)</label>
                      <Input name="englishFamilyName" value={formData.englishFamilyName} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* Identity & Demographics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Identifier</label>
                      <Input name="identifier" value={formData.identifier} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      <Input name="username" value={formData.username} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <Input name="role" value={formData.role} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <Input name="status" value={formData.status} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <Input name="type" value={formData.type} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Enabled</label>
                      <Input name="enabledUser" value={formData.enabledUser} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <Input name="gender" value={formData.gender} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Date</label>
                      <Input type="date" name="birthDate" value={formData.birthDate} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                      <Input name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      <Input name="religion" value={formData.religion} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality (EN)</label>
                      <Input name="nationality" value={formData.nationality} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality (AR)</label>
                      <Input name="nationalityArabic" value={formData.nationalityArabic} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Country (EN)</label>
                      <Input name="birthCountry" value={formData.birthCountry} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth Country (AR)</label>
                      <Input name="birthCountryArabic" value={formData.birthCountryArabic} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth City (AR)</label>
                      <Input name="birthCity" value={formData.birthCity} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Birth City (EN)</label>
                      <Input name="englishBirthCity" value={formData.englishBirthCity} onChange={handleInputChange} />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <Input name="address_country" value={formData.address_country} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <Input name="address_state" value={formData.address_state} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <Input name="address_city" value={formData.address_city} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                      <Input name="address_addressLine1" value={formData.address_addressLine1} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                      <Input name="address_addressLine2" value={formData.address_addressLine2} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 3</label>
                      <Input name="address_addressLine3" value={formData.address_addressLine3} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <Input name="address_zipCode" value={formData.address_zipCode} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PO Box</label>
                      <Input name="address_poBox" value={formData.address_poBox} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                      <Input name="address_region" value={formData.address_region} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                      <Input name="address_sector" value={formData.address_sector} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Road Number</label>
                      <Input name="address_roadNumber" value={formData.address_roadNumber} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plot Id</label>
                      <Input name="address_plotId" value={formData.address_plotId} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Plot Number</label>
                      <Input name="address_plotNumber" value={formData.address_plotNumber} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className={clsx("flex gap-3")}> 
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className={clsx("flex items-center space-x-2", locale === 'ar' && 'space-x-reverse')}
                    >
                      {isSaving ? (
                        <LoadingIcon className="w-4 h-4" />
                      ) : (
                        <CheckIcon className="w-4 h-4" />
                      )}
                      <span>{isSaving ? t.common.saving : t.profile.saveChanges}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t.profile.cancel}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Image
                      className="w-16 h-16 rounded-full"
                      src={profileData.avatar}
                      alt={`${formData.name} avatar`}
                      width={64}
                      height={64}
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{formData.name}</h3>
                      <p className="text-sm text-gray-600">{t.profile.parentAccount}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.profile.emailAddress}
                      </label>
                      <p className="text-sm text-gray-900">{formData.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t.profile.phoneNumber}
                      </label>
                      <p className="text-sm text-gray-900">{formData.phone}</p>
                    </div>
                  </div>

                  {/* Identity */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Identity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Identifier</p>
                        <p className="text-sm text-gray-900 break-all">{person.identifier || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Username</p>
                        <p className="text-sm text-gray-900 break-all">{person.username || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Sourced ID</p>
                        <p className="text-sm text-gray-900 break-all">{person.sourcedId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm text-gray-900">{person.role || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <p className="text-sm text-gray-900">{person.status || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm text-gray-900">{person.type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Enabled</p>
                        <p className="text-sm text-gray-900">{typeof person.enabledUser === 'boolean' ? String(person.enabledUser) : (person.enabledUser || '-')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Last Modified</p>
                        <p className="text-sm text-gray-900">{person.dateLastModified ? new Date(person.dateLastModified).toLocaleString(locale) : '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">User IDs</p>
                        <p className="text-sm text-gray-900">{person.userIds || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">SMS</p>
                        <p className="text-sm text-gray-900">{person.sms || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Agents</p>
                        <p className="text-sm text-gray-900">{person.agents || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Grades</p>
                        <p className="text-sm text-gray-900">{person.grades || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Names */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Names</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Arabic Given</p>
                        <p className="text-sm text-gray-900">{person.givenName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Arabic Middle</p>
                        <p className="text-sm text-gray-900">{person.middleName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Arabic Family</p>
                        <p className="text-sm text-gray-900">{person.familyName || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">English First</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishFirstName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth Name</p>
                        <p className="text-sm text-gray-900">{person.metadata?.birthName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">English Second</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishSecondName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">English Third</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishThirdName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">English Fourth</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishFourthName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">English Family</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishFamilyName || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Lists */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Lists</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Role List</p>
                        <p className="text-sm text-gray-900">{person.metadata?.roleList || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Active Role List</p>
                        <p className="text-sm text-gray-900">{person.metadata?.activeRoleList || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Demographics */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Demographics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="text-sm text-gray-900">{person.metadata?.gender || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth Date</p>
                        <p className="text-sm text-gray-900">{person.metadata?.birthDate || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Marital Status</p>
                        <p className="text-sm text-gray-900">{person.metadata?.maritalStatus || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Religion</p>
                        <p className="text-sm text-gray-900">{person.metadata?.religion || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Nationality (EN)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.nationality || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Nationality (AR)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.nationalityArabic || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth Country (EN)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.birthCountry || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth Country (AR)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.birthCountryArabic || '-'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-gray-500">Birth City (AR)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.birthCity || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Birth City (EN)</p>
                        <p className="text-sm text-gray-900">{person.metadata?.englishBirthCity || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Contacts</h4>
                    {person.metadata?.contacts?.length ? (
                      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
                        {person.metadata.contacts.map((c, idx) => (
                          <li key={idx} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-900">{c.value || '-'}</p>
                              <p className="text-xs text-gray-500">{c.contactType || 'Contact'}</p>
                            </div>
                            {c.isPrivate !== undefined && (
                              <span className={clsx('text-xs px-2 py-0.5 rounded-full', c.isPrivate ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700')}>
                                {c.isPrivate ? 'Private' : 'Shared'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500">No contacts available</p>
                    )}
                  </div>

                  {/* Address */}
                  <div className="pt-2">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Primary Address</h4>
                    {person.metadata?.addresses?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Country</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.country || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">State</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.state || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">City</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.city || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">ZIP Code</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.zipCode || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">PO Box</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.poBox || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Region</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.region || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Sector</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.sector || '-'}</p>
                        </div>
                        <div className="md:col-span-3">
                          <p className="text-xs text-gray-500">Address Lines</p>
                          <p className="text-sm text-gray-900">{[primaryAddress?.addressLine1, primaryAddress?.addressLine2, primaryAddress?.addressLine3].filter(Boolean).join(', ') || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Road Number</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.roadNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Plot Id</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.plotId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Plot Number</p>
                          <p className="text-sm text-gray-900">{primaryAddress?.plotNumber || '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No address available</p>
                    )}
                  </div>

                  {/* Raw JSON (debug) */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-700">Raw JSON</summary>
                    <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-auto">
{JSON.stringify(person, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Children Information */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>{t.profile.linkedChildren}</CardTitle>
              <p className="text-sm text-gray-600">{t.profile.linkedChildrenSubtitle}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileData.children.map((child: any) => (
                  <div key={child.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className={clsx("flex items-center space-x-3", locale === 'ar' && 'space-x-reverse')}>
                      <Image
                        className="w-10 h-10 rounded-full"
                        src={child.avatar}
                        alt={`${child.name} avatar`}
                        width={40}
                        height={40}
                      />
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

        {/* Settings & Preferences */}
        <div>
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

          {/* Account Actions */}
          <Card className="mt-6">
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