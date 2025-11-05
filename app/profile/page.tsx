"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications';
import { 
  EditIcon,
  SettingsIcon,
  ChevronRightIcon,
  DownloadIcon
} from '../components/icons';
import { 
  Shield,
  Key,
  EyeSlash,
  UserMinus
} from '@phosphor-icons/react';
import { ProfileIcon } from '../components/icons';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { Person } from '@/types';
import { useI18n } from '@/app/i18n/I18nProvider';
import clsx from 'clsx';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const toast = useToastNotifications();

  // Get session to extract EID (external identifier)
  const { data: session, status } = useSession();
  // You may need to adjust this depending on your session shape
  // Use emiratesId or id from session.user for EID

  const eid = session?.user?.emiratesId || session?.user?.id || session?.user?.email;

  // During HMR, avoid rendering aggressive redirects; show a lightweight loader if auth is loading
  if (status === 'loading') {
    return <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 text-center text-muted-foreground">Loading session…</div>;
  }

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

  interface ProfileData {
    preferences: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      pushNotifications: boolean;
    };
    children: Array<{
      id: string;
      name: string;
      avatar: string;
      grade: string;
      teacher: string;
    }>;
    avatar: string;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Preferences and children state (initialize from API if available)
  const [profileData, setProfileData] = useState<ProfileData>({
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
      setProfileData((prev) => ({
        ...prev,
        avatar: (person?.metadata?.avatar as string) || '/avatar.svg',
        children: children.map((child: any) => ({
          id: child.sourcedId || '',
          name: [child.metadata?.englishFirstName, child.metadata?.englishFamilyName].filter(Boolean).join(' ') || 'Unknown',
          avatar: (child.metadata?.avatar as string) || '/avatar.svg',
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

  const toast = useToastNotifications();
  
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      // In a real app, you would save this to an API
      setIsEditing(false);
      setIsSaving(false);
      toast.success(
        locale === 'ar' ? 'تم التحديث' : 'Updated',
        t.profile.updatedSuccess
      );
    }, 1500);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePreferenceChange = (key: keyof typeof profileData.preferences) => {
    setProfileData((prev) => ({
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
    <div className={clsx("min-h-screen bg-background", locale === 'ar' && 'direction-rtl')}>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-lg flex items-center justify-center">
                <ProfileIcon className="w-12 h-12 sm:w-14 sm:h-14 text-primary" weight="duotone" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background shadow-sm"></div>
            </div>
            <div className="flex-1 text-center sm:text-start">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {formData.name}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground mb-4">
                <Badge variant="secondary" className="text-xs">
                  {t.profile.parentAccount}
                </Badge>
                <span className="hidden sm:inline">•</span>
                <span className="text-sm">{formData.identifier}</span>
              </div>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                  className="group transition-all duration-200 hover:shadow-md"
                >
                  <EditIcon className="w-4 h-4 me-2 group-hover:scale-110 transition-transform" />
                  <span>{t.profile.edit}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact & Identity */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ProfileIcon className="w-4 h-4 text-primary" />
                  </div>
                  {t.profile.personalInfo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">{t.profile.emailAddress}</dt>
                    <dd className="text-base text-foreground font-medium">{formData.email || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">{t.profile.phoneNumber}</dt>
                    <dd className="text-base text-foreground font-medium">{formData.phone || '-'}</dd>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Identifier</dt>
                    <dd className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded">
                      {person.identifier || '-'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Username</dt>
                    <dd className="text-sm text-foreground">{person.username || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Role</dt>
                    <dd>
                      <Badge variant="outline" className="text-xs">
                        {person.role || 'Parent'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd>
                      <Badge 
                        variant={person.status === 'active' ? 'default' : 'secondary'} 
                        className="text-xs"
                      >
                        {person.status || 'Active'}
                      </Badge>
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Demographics & Names */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <ProfileIcon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  Demographics & Names
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                    <dd className="text-sm text-foreground capitalize">{person.metadata?.gender || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Birth Date</dt>
                    <dd className="text-sm text-foreground">{person.metadata?.birthDate || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Nationality (EN)</dt>
                    <dd className="text-sm text-foreground">{person.metadata?.nationality || '-'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-sm font-medium text-muted-foreground">Nationality (AR)</dt>
                    <dd className="text-sm text-foreground">{person.metadata?.nationalityArabic || '-'}</dd>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <dt className="text-sm font-semibold text-foreground">Arabic Name</dt>
                    <dd className="text-base text-foreground font-medium" dir="rtl">
                      {[person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ') || '-'}
                    </dd>
                  </div>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <dt className="text-sm font-semibold text-foreground">English Name</dt>
                    <dd className="text-base text-foreground font-medium">
                      {[person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFourthName, person.metadata?.englishFamilyName].filter(Boolean).join(' ') || '-'}
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-secondary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  Primary Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                {primaryAddress ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Country</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.country || '-'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">State</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.state || '-'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">City</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.city || '-'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">ZIP Code</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.zipCode || '-'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">PO Box</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.poBox || '-'}</dd>
                      </div>
                      <div className="space-y-1">
                        <dt className="text-sm font-medium text-muted-foreground">Region</dt>
                        <dd className="text-sm text-foreground">{primaryAddress.region || '-'}</dd>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                      <dt className="text-sm font-semibold text-foreground">Full Address</dt>
                      <dd className="text-sm text-foreground leading-relaxed">
                        {[primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean).join(', ') || 'No address lines provided'}
                      </dd>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <span className="text-xs text-muted-foreground">Road: </span>
                          <span className="text-xs text-foreground">{primaryAddress.roadNumber || '-'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Plot: </span>
                          <span className="text-xs text-foreground">{primaryAddress.plotNumber || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p>No address information available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Children */}
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  {t.profile.linkedChildren}
                </CardTitle>
                <p className="text-sm text-muted-foreground ms-11">{t.profile.linkedChildrenSubtitle}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profileData.children.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                      </svg>
                      <p>No linked children found</p>
                    </div>
                  ) : (
                    profileData.children.map((child: any) => (
                      <div key={child.id} className="group/child flex items-center justify-between p-4 border border-border rounded-xl bg-card hover:bg-accent/50 transition-all duration-200">
                        <div className={clsx("flex items-center gap-4", locale === 'ar' && 'flex-row-reverse')}>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center group-hover/child:scale-105 transition-transform">
                            <ProfileIcon className="w-6 h-6 text-primary" weight="duotone" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground text-sm">{child.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{child.grade}</span>
                              <span>•</span>
                              <span>{child.teacher}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border-green-200">
                            {t.profile.active}
                          </Badge>
                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground group-hover/child:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preferences & Actions */}
          <div className="space-y-6">
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <SettingsIcon className="w-4 h-4 text-accent-foreground" />
                  </div>
                  {t.profile.notificationPreferences}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{t.profile.emailNotifications}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.profile.emailNotificationsDesc}</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('emailNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        profileData.preferences.emailNotifications ? 'bg-primary shadow-md' : 'bg-input'
                      }`}
                      role="switch"
                      aria-checked={profileData.preferences.emailNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform duration-200 ${
                          profileData.preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{t.profile.smsNotifications}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.profile.smsNotificationsDesc}</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('smsNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        profileData.preferences.smsNotifications ? 'bg-primary shadow-md' : 'bg-input'
                      }`}
                      role="switch"
                      aria-checked={profileData.preferences.smsNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform duration-200 ${
                          profileData.preferences.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  <Separator />
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">{t.profile.pushNotifications}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t.profile.pushNotificationsDesc}</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('pushNotifications')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                        profileData.preferences.pushNotifications ? 'bg-primary shadow-md' : 'bg-input'
                      }`}
                      role="switch"
                      aria-checked={profileData.preferences.pushNotifications}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-background shadow-sm transition-transform duration-200 ${
                          profileData.preferences.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-semibold">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-secondary-foreground" />
                  </div>
                  {t.profile.accountActions}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-11 group/btn hover:shadow-sm transition-all duration-200" 
                    size="sm"
                  >
                    <Key className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    <span>{t.profile.changePassword}</span>
                    <ChevronRightIcon className="w-4 h-4 ms-auto text-muted-foreground group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-11 group/btn hover:shadow-sm transition-all duration-200" 
                    size="sm"
                  >
                    <EyeSlash className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    <span>{t.profile.privacySettings}</span>
                    <ChevronRightIcon className="w-4 h-4 ms-auto text-muted-foreground group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-11 group/btn hover:shadow-sm transition-all duration-200" 
                    size="sm"
                  >
                    <DownloadIcon className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                    <span>{t.profile.downloadData}</span>
                    <ChevronRightIcon className="w-4 h-4 ms-auto text-muted-foreground group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                  <Separator className="my-4" />
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/5 hover:border-destructive/20 group/btn transition-all duration-200" 
                    size="sm"
                  >
                    <UserMinus className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                    <span>{t.profile.deactivateAccount}</span>
                    <ChevronRightIcon className="w-4 h-4 ms-auto group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}