"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Globe
} from '@phosphor-icons/react';

export default function ProfilePage() {
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  
  const eid = (session?.user as any)?.emiratesId || (session?.user as any)?.id || session?.user?.email;

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
    return p.email || p.metadata?.contacts?.[0]?.value || '';
  };

  const getPrimaryPhone = (p: Person): string => {
    const phoneContact = p.metadata?.contacts?.find(
      (c: any) => c.contactType?.toLowerCase().includes('mobile')
    );
    return p.phone || phoneContact?.value || '';
  };

  const getDisplayName = (p: Person, lng: string): string => {
    if (lng === 'ar') {
      return [p.givenName, p.familyName].filter(Boolean).join(' ') || p.username || 'User';
    }
    return [p.metadata?.englishFirstName, p.metadata?.englishFamilyName].filter(Boolean).join(' ') || p.username || 'User';
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
                <span className="hidden sm:inline">•</span>
                <span className="text-sm">{person.identifier}</span>
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

                {/* All Other Contacts */}
                {contacts.length > 0 && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {locale === 'ar' ? 'جميع جهات الاتصال' : 'All Contacts'}
                      </h4>
                      {contacts.map((contact: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          {contact.contactType?.toLowerCase().includes('email') ? (
                            <EnvelopeSimple className="w-4 h-4 text-muted-foreground mt-0.5" weight="duotone" />
                          ) : (
                            <Phone className="w-4 h-4 text-muted-foreground mt-0.5" weight="duotone" />
                          )}
                          <div className="flex-1">
                            <dt className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                              {contact.contactType || (locale === 'ar' ? 'اتصال' : 'Contact')}
                              {contact.isPrimary && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                  {locale === 'ar' ? 'أساسي' : 'Primary'}
                                </Badge>
                              )}
                            </dt>
                            <dd className="text-sm text-foreground">{contact.value || '-'}</dd>
                            {contact.note && (
                              <dd className="text-xs text-muted-foreground mt-1">{contact.note}</dd>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Personal Details */}
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
                      <dd className="text-sm text-foreground font-medium" dir="rtl">{arabicName}</dd>
                    </div>
                  )}
                  {englishName && (
                    <div className="p-3 rounded-lg bg-muted/30">
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'الاسم بالإنجليزي' : 'English Name'}
                      </dt>
                      <dd className="text-sm text-foreground font-medium">{englishName}</dd>
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

            {/* Addresses */}
            {addresses.length > 0 && (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-primary" weight="duotone" />
                    {locale === 'ar' ? 'العناوين' : 'Addresses'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {addresses.map((address: any, index: number) => {
                    const isPrimary = index === 0;
                    const addressLines = [address.addressLine1, address.addressLine2, address.addressLine3].filter(Boolean);
                    const cityCountry = [address.city, address.state, address.country].filter(Boolean).join(', ');
                    
                    return (
                      <div 
                        key={index}
                        className={`p-4 rounded-lg border transition-all ${
                          isPrimary 
                            ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' 
                            : 'bg-muted/30 border-border hover:bg-muted/50'
                        }`}
                      >
                        {/* Header with Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${isPrimary ? 'text-primary' : 'text-muted-foreground'}`} weight="duotone" />
                            <span className="text-xs font-semibold text-foreground">
                              {locale === 'ar' ? `العنوان ${index + 1}` : `Address ${index + 1}`}
                            </span>
                          </div>
                          {isPrimary && (
                            <Badge variant="default" className="text-[10px] px-2 py-0.5">
                              {locale === 'ar' ? 'أساسي' : 'Primary'}
                            </Badge>
                          )}
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
                          {(address.zipCode || address.poBox || address.region) && (
                            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-border/50">
                              {address.zipCode && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'الرمز البريدي:' : 'ZIP:'} </span>
                                  <span className="text-foreground font-medium">{address.zipCode}</span>
                                </div>
                              )}
                              {address.poBox && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'ص.ب:' : 'P.O. Box:'} </span>
                                  <span className="text-foreground font-medium">{address.poBox}</span>
                                </div>
                              )}
                              {address.region && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">{locale === 'ar' ? 'المنطقة:' : 'Region:'} </span>
                                  <span className="text-foreground font-medium">{address.region}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Quick Info */}
          <div className="space-y-6">
            
            {/* Status Card */}
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
                    {locale === 'ar' ? 'المعرف' : 'Identifier'}
                  </dt>
                  <dd className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded">
                    {person.identifier || '-'}
                  </dd>
                </div>
                {person.sourcedId && (
                  <>
                    <Separator />
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground mb-2">
                        {locale === 'ar' ? 'المعرف المصدر' : 'Source ID'}
                      </dt>
                      <dd className="text-xs text-foreground font-mono bg-muted px-2 py-1 rounded break-all">
                        {person.sourcedId}
                      </dd>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Birth Info Card */}
            {(person.metadata?.birthCity || person.metadata?.birthCountry) && (
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">
                    {locale === 'ar' ? 'معلومات الميلاد' : 'Birth Information'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {person.metadata?.birthCity && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'مدينة الميلاد' : 'Birth City'}
                      </dt>
                      <dd className="text-sm text-foreground">
                        {locale === 'ar' ? person.metadata.birthCity : (person.metadata.englishBirthCity || person.metadata.birthCity)}
                      </dd>
                    </div>
                  )}
                  {person.metadata?.birthCountry && (
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground mb-1">
                        {locale === 'ar' ? 'بلد الميلاد' : 'Birth Country'}
                      </dt>
                      <dd className="text-sm text-foreground">
                        {locale === 'ar' ? (person.metadata.birthCountryArabic || person.metadata.birthCountry) : person.metadata.birthCountry}
                      </dd>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
