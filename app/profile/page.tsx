"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileIcon } from '../components/icons';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import type { Person } from '@/app/types';
import { useI18n } from '@/app/i18n/I18nProvider';
import { 
  EnvelopeSimple, 
  Phone, 
  IdentificationCard, 
  MapPin, 
  CalendarBlank,
  GenderIntersex,
  Globe,
  Warning
} from '@phosphor-icons/react';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  
  const emiratesId = (session?.user as any)?.emiratesId;
  const eid = emiratesId || (session?.user as any)?.id || session?.user?.email;
  const hasEmiratesId = Boolean(emiratesId);

  if (status === 'loading') {
    return <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 text-center text-muted-foreground">Loading session…</div>;
  }

  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error, isLoading } = useSWR(
    eid ? `/api/PP/persons?eid=${encodeURIComponent(eid)}` : null,
    fetcher
  );

  // Extract person from the response - it's nested in persons array
  const person: Person | undefined = data?.persons?.[0] || data?.person || data;

  // Debug: log the data
  React.useEffect(() => {
    if (data) {
      console.log('API Response:', data);
      console.log('Extracted person:', person);
    }
  }, [data, person]);

  const getPrimaryEmail = (p: Person): string => {
    const primaryEmail = p.metadata?.contacts?.find(
      (c: any) => c.isPrimary && c.contactType?.toLowerCase().includes('email')
    );
    const anyEmail = p.metadata?.contacts?.find(
      (c: any) => c.contactType?.toLowerCase().includes('email')
    );
    return primaryEmail?.value || anyEmail?.value || '';
  };

  const getPrimaryPhone = (p: Person): string => {
    const primaryPhone = p.metadata?.contacts?.find(
      (c: any) => c.isPrimary && (c.contactType?.toLowerCase().includes('phone') || c.contactType?.toLowerCase().includes('mobile'))
    );
    const anyPhone = p.metadata?.contacts?.find(
      (c: any) => c.contactType?.toLowerCase().includes('phone') || c.contactType?.toLowerCase().includes('mobile')
    );
    return primaryPhone?.value || anyPhone?.value || '';
  };  const getDisplayName = (p: Person, lng: string): string => {
    if (lng === 'ar') {
      return [p.givenName, p.familyName].filter(Boolean).join(' ') || p.username || 'User';
    }
    return [p.metadata?.englishFirstName, p.metadata?.englishFamilyName].filter(Boolean).join(' ') || p.username || 'User';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Skeleton */}
        <div className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl" />
              <div className="flex-1 text-center sm:text-start space-y-3 w-full">
                <Skeleton className="h-8 sm:h-10 w-64 mx-auto sm:mx-0" />
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Information Skeleton */}
              <Card className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-32" />
                    {[1, 2].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Personal Details Skeleton */}
              <Card className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Addresses Skeleton */}
              <Card className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                      <div className="flex items-center justify-between mb-3">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
                          <Skeleton className="h-3 w-20" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Status Card Skeleton */}
              <Card className="shadow-sm">
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Skeleton className="h-3 w-24 mb-2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Separator />
                  <div>
                    <Skeleton className="h-3 w-28 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="text-center py-10 text-red-600">Error loading profile data.</div>;
  }
  if (!person) {
    return <div className="text-center py-10">No profile data found.</div>;
  }

  const displayName = getDisplayName(person, locale);
  const email = getPrimaryEmail(person);
  const phone = getPrimaryPhone(person);
  const arabicName = [person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ');
  const englishName = [
    person.metadata?.englishFirstName,
    person.metadata?.englishSecondName, 
    person.metadata?.englishThirdName,
    person.metadata?.englishFourthName,
    person.metadata?.englishFamilyName
  ].filter(Boolean).join(' ');
  const addresses = person.metadata?.addresses || [];
  const contacts = person.metadata?.contacts || [];

  // If no Emirates ID, show only the warning
  if (!hasEmiratesId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-background to-orange-50/30 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10 flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          <Card className="border-amber-200 dark:border-amber-800 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12">
              {/* Icon Container */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-400 dark:bg-amber-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 flex items-center justify-center shadow-lg">
                    <Warning className="w-10 h-10 sm:w-12 sm:h-12 text-white" weight="fill" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-amber-900 dark:text-amber-100 mb-4">
                {t.profile.missingEmiratesIdTitle}
              </h2>

              {/* Message */}
              <p className="text-base sm:text-lg text-center text-amber-800/90 dark:text-amber-200/90 mb-8 leading-relaxed max-w-2xl mx-auto">
                {t.profile.missingEmiratesIdMessage}
              </p>

              {/* Divider */}
              <div className="relative mb-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-amber-200 dark:border-amber-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-950 px-4 text-amber-600 dark:text-amber-400 font-medium">
                    {locale === 'ar' ? 'الإجراء المطلوب' : 'Action Required'}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://uaepass.ae"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 dark:from-amber-500 dark:to-orange-500 dark:hover:from-amber-600 dark:hover:to-orange-600 text-white rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                >
                  <IdentificationCard className="w-5 h-5 group-hover:scale-110 transition-transform" weight="duotone" />
                  <span>{t.profile.updateUAEPass}</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                  </svg>
                </a>
              </div>

               
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
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
                {displayName}
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-2 text-muted-foreground mb-4">
                <Badge variant="secondary" className="text-xs">
                  {t.profile.parentAccount}
                </Badge>
                {person.identifier && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-sm">{person.identifier}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contact Information */}
            {(email || phone || contacts.length > 0) && (
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-primary" weight="duotone" />
                  {locale === 'ar' ? 'معلومات الاتصال' : 'Contact Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Email */}
                {email && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                    <EnvelopeSimple className="w-5 h-5 text-primary mt-0.5" weight="duotone" />
                    <div className="flex-1">
                      <dt className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        {locale === 'ar' ? 'البريد الإلكتروني الأساسي' : 'Primary Email'}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {locale === 'ar' ? 'أساسي' : 'Primary'}
                        </Badge>
                      </dt>
                      <dd className="text-sm text-foreground font-medium">{email}</dd>
                    </div>
                  </div>
                )}
                
                {/* Primary Phone */}
                {phone && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
                    <Phone className="w-5 h-5 text-primary mt-0.5" weight="duotone" />
                    <div className="flex-1">
                      <dt className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                        {locale === 'ar' ? 'رقم الهاتف الأساسي' : 'Primary Phone'}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {locale === 'ar' ? 'أساسي' : 'Primary'}
                        </Badge>
                      </dt>
                      <dd className="text-sm text-foreground font-medium">{phone}</dd>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>
            )}

            {/* Personal Details */}
            {(arabicName || englishName || person.metadata?.birthDate || person.metadata?.gender || person.metadata?.nationality || person.metadata?.maritalStatus) && (
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IdentificationCard className="w-5 h-5 text-primary" weight="duotone" />
                  {locale === 'ar' ? 'التفاصيل الشخصية' : 'Personal Details'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {arabicName && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'الاسم بالعربي' : 'Arabic Name'}
                      </dt>
                      <dd className="text-sm text-foreground font-medium" dir="rtl" style={{ textAlign: 'right' }}>{arabicName}</dd>
                    </div>
                  )}
                  {englishName && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'الاسم بالإنجليزي' : 'English Name'}
                      </dt>
                      <dd className="text-sm text-foreground font-medium" dir="ltr">{englishName}</dd>
                    </div>
                  )}
                  {person.metadata?.birthDate && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <CalendarBlank className="w-5 h-5 text-muted-foreground mt-0.5" weight="duotone" />
                      <div className="flex-1">
                        <dt className="text-xs font-medium text-muted-foreground mb-1">
                          {locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}
                        </dt>
                        <dd className="text-sm text-foreground font-medium">{person.metadata.birthDate}</dd>
                      </div>
                    </div>
                  )}
                  {person.metadata?.gender && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <GenderIntersex className="w-5 h-5 text-muted-foreground mt-0.5" weight="duotone" />
                      <div className="flex-1">
                        <dt className="text-xs font-medium text-muted-foreground mb-1">
                          {locale === 'ar' ? 'الجنس' : 'Gender'}
                        </dt>
                        <dd className="text-sm text-foreground font-medium capitalize">{person.metadata.gender}</dd>
                      </div>
                    </div>
                  )}
                  {person.metadata?.nationality && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Globe className="w-5 h-5 text-muted-foreground mt-0.5" weight="duotone" />
                      <div className="flex-1">
                        <dt className="text-xs font-medium text-muted-foreground mb-1">
                          {locale === 'ar' ? 'الجنسية' : 'Nationality'}
                        </dt>
                        <dd className="text-sm text-foreground font-medium">
                          {locale === 'ar' ? (person.metadata.nationalityArabic || person.metadata.nationality) : person.metadata.nationality}
                        </dd>
                      </div>
                    </div>
                  )}
                  {person.metadata?.maritalStatus && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'الحالة الاجتماعية' : 'Marital Status'}
                      </dt>
                      <dd className="text-sm text-foreground font-medium capitalize">{person.metadata.maritalStatus}</dd>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            )}

            {/* Addresses */}
            {addresses.length > 0 && (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-primary" weight="duotone" />
                    {locale === 'ar' ? 'العنوان' : 'Address'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Find primary address or fall back to first address
                    const primaryAddress = addresses.find((a: any) => a.isPrimary) || addresses[0];
                    const addressLines = [primaryAddress.addressLine1, primaryAddress.addressLine2, primaryAddress.addressLine3].filter(Boolean);
                    const cityCountry = [primaryAddress.city, primaryAddress.state, primaryAddress.country].filter(Boolean).join(', ');
                    
                    return (
                      <div className="p-4 rounded-lg border bg-primary/5 border-primary/20 hover:bg-primary/10 transition-all">
                        {/* Header with Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary" weight="duotone" />
                            <span className="text-xs font-semibold text-foreground">
                              {locale === 'ar' ? 'العنوان الأساسي' : 'Primary Address'}
                            </span>
                          </div>
                          <Badge variant="default" className="text-[10px] px-2 py-0.5">
                            {locale === 'ar' ? 'أساسي' : 'Primary'}
                          </Badge>
                        </div>

                        {/* Address Details */}
                        <div className="space-y-2">
                          {addressLines.length > 0 && (
                            <p className="text-sm text-foreground leading-relaxed">
                              {addressLines.join(', ')}
                            </p>
                          )}
                          
                          {cityCountry && (
                            <p className="text-sm text-muted-foreground">
                              {cityCountry}
                            </p>
                          )}

                          {/* Additional Details */}
                          {(primaryAddress.zipCode || primaryAddress.poBox || primaryAddress.region) && (
                            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
                              {primaryAddress.zipCode && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'الرمز البريدي:' : 'ZIP:'} </span>
                                  <span className="text-foreground font-medium">{primaryAddress.zipCode}</span>
                                </div>
                              )}
                              {primaryAddress.poBox && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'ص.ب:' : 'P.O. Box:'} </span>
                                  <span className="text-foreground font-medium">{primaryAddress.poBox}</span>
                                </div>
                              )}
                              {primaryAddress.region && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'المنطقة:' : 'Region:'} </span>
                                  <span className="text-foreground font-medium">{primaryAddress.region}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            
            {/* Status Card */}
            {(person.status || person.identifier || person.sourcedId) && (
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">
                  {locale === 'ar' ? 'الحالة' : 'Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground mb-2">
                    {locale === 'ar' ? 'حالة الحساب' : 'Account Status'}
                  </dt>
                  <dd>
                    <Badge 
                      variant={person.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {person.status === 'active' ? (locale === 'ar' ? 'نشط' : 'Active') : (locale === 'ar' ? 'غير نشط' : 'Inactive')}
                    </Badge>
                  </dd>
                </div>
                <Separator />
                <div>
                  <dt className="text-xs font-medium text-muted-foreground mb-2">
                    {locale === 'ar' ? 'الهوية الإماراتية' : 'Emirates ID'}
                  </dt>
                  <dd className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded">
                    {person.identifier || '-'}
                  </dd>
                </div>
                
              </CardContent>
            </Card>
            )}

       
          </div>
        </div>
      </div>
    </div>
  );
}
