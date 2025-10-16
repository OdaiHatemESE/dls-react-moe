'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import clsx from 'clsx';
import Link from 'next/link';

import { useI18n } from '@/app/i18n/I18nProvider';
import { jsonFetcher } from '@/lib/swr';
import { Person } from '@/types';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

interface BasicInfoResponse {
  meta: {
    eid: string;
    personSourcedId: string;
    role: string;
    studentCount: number;
    cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null };
  };
  parent: Person[];
  children: Person[];
}

export default function EditChildPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const router = useRouter();
  const sourcedId = params.id as string;

  const swrKey = sourcedId ? `/api/oneroster/basic-info-full?sourcedId=${encodeURIComponent(sourcedId)}` : null;
  const { data, error, isLoading } = useSWR<BasicInfoResponse>(swrKey, jsonFetcher);

  const [formData, setFormData] = React.useState<Partial<Person>>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [dataConfirmed, setDataConfirmed] = React.useState(false);
  const [needsUpdate, setNeedsUpdate] = React.useState<boolean | null>(null);
  const [enabledSections, setEnabledSections] = React.useState({
    basicInfo: false,
    demographics: false,
    address: false
  });

  React.useEffect(() => {
    if (data) {
      const person = data.parent?.[0] || data.children?.[0];
      if (person) {
        setFormData(person);
      }
    }
  }, [data]);

  if (isLoading) {
    return <LoadingSkeleton locale={locale} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 text-destructive bg-destructive/10 border border-destructive/20 rounded p-4">
            {error.warning || t.child.error_loading_child_data}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-10">{t.child.no_data_available_for_child}</div>;
  }

  const person = data.parent?.[0] || data.children?.[0];
  if (!person) {
    return <div className="text-center py-10">{t.child.child_not_found}</div>;
  }

  const displayName = locale === 'ar'
    ? [person.givenName, person.middleName, person.familyName].filter(Boolean).join(' ')
    : [person.metadata?.englishFirstName, person.metadata?.englishSecondName, person.metadata?.englishThirdName, person.metadata?.englishFamilyName].filter(Boolean).join(' ');

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        addresses: [
          {
            ...(prev.metadata?.addresses?.[0] || {}),
            [field]: value
          }
        ]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // TODO: Implement API call to update student information
      console.log('Saving data:', formData);
      console.log('Data confirmed without changes:', dataConfirmed);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect back to child detail page
      router.push(`/child/${sourcedId}`);
    } catch (error) {
      console.error('Error saving data:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving data');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmCorrect = () => {
    setDataConfirmed(true);
    setNeedsUpdate(false);
  };

  const handleNeedUpdate = () => {
    setNeedsUpdate(true);
    setDataConfirmed(false);
  };

  const toggleSection = (section: 'basicInfo' | 'demographics' | 'address') => {
    setEnabledSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const primaryAddress = formData.metadata?.addresses?.[0];

  return (
    <div className={clsx("min-h-screen bg-gradient-to-br from-background/50 via-background to-background/50", locale === 'ar' && 'direction-rtl')}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 rtl:space-x-reverse" aria-label="Breadcrumb">
              <Link 
                href="/dashboard" 
                className={clsx(
                  "group inline-flex items-center px-2 py-2 md:px-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted",
                  "touch-manipulation select-none"
                )}
              >
                <svg className={clsx(
                  "w-4 h-4 me-1 md:me-2 transition-all duration-200 group-hover:scale-110 group-active:scale-95",
                  locale === 'ar' && 'rotate-180'
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold text-xs">{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </Link>
              
              <svg className="w-3 h-3 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>

              <Link 
                href={`/child/${sourcedId}`}
                className={clsx(
                  "group inline-flex items-center px-2 py-2 md:px-3 md:py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted/90",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-muted",
                  "touch-manipulation select-none"
                )}
              >
                <span className="font-semibold text-xs">{locale === 'ar' ? 'ملف الطالب' : 'Student'}</span>
              </Link>
              
              <svg className="w-3 h-3 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
              
              <div className="flex items-center px-2 py-2 md:px-3">
                <svg className="w-3 h-3 me-1 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs font-semibold text-foreground">
                  {locale === 'ar' ? 'تعديل' : 'Edit'}
                </span>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Profile Header */}
        <div className="relative mb-6 md:mb-8">
          <Card className="border-0 shadow-lg bg-card overflow-hidden">
            <div className="relative px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-primary/80 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg ring-2 md:ring-4 ring-background">
                    <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Student Information */}
                <div className={clsx("flex-1 min-w-0", locale === 'ar' && 'text-right')}>
                  <div className="mb-2 md:mb-3">
                    <h1 className={clsx(
                      "text-lg md:text-xl font-bold text-foreground mb-1",
                      locale === 'ar' ? 'leading-relaxed' : 'leading-tight'
                    )}>
                      {locale === 'ar' ? 'تعديل معلومات الطالب' : 'Edit Student Information'}
                    </h1>
                    <p className="text-muted-foreground font-medium text-xs md:text-sm">
                      {displayName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Data Confirmation Alert */}
        {needsUpdate === null && (
          <Card className="border-2 border-blue-500 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className={clsx(
                    "text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2",
                    locale === 'ar' && 'text-right'
                  )}>
                    {locale === 'ar' 
                      ? 'مراجعة وتأكيد البيانات' 
                      : 'Review and Confirm Student Information'}
                  </h3>
                  <p className={clsx(
                    "text-sm md:text-base text-gray-700 dark:text-gray-300 mb-4",
                    locale === 'ar' && 'text-right leading-relaxed'
                  )}>
                    {locale === 'ar'
                      ? 'يرجى مراجعة معلومات الطالب أدناه بعناية. هل المعلومات الموضحة صحيحة ومحدثة؟'
                      : 'Please carefully review the student information below. Is all the displayed information correct and up to date?'}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      type="button"
                      onClick={handleConfirmCorrect}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 shadow-md"
                    >
                      <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {locale === 'ar' 
                        ? 'نعم، المعلومات صحيحة' 
                        : 'Yes, Information is Correct'}
                    </Button>
                    
                    <Button
                      type="button"
                      onClick={handleNeedUpdate}
                      variant="outline"
                      className="flex-1 border-2 border-orange-500 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950 font-semibold py-3 shadow-md"
                    >
                      <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {locale === 'ar' 
                        ? 'لا، أحتاج إلى تحديث المعلومات' 
                        : 'No, I Need to Update Information'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success Confirmation Message */}
        {needsUpdate === false && (
          <Card className="border-2 border-green-500 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className={clsx(
                    "text-base font-semibold text-green-800 dark:text-green-200",
                    locale === 'ar' && 'text-right'
                  )}>
                    {locale === 'ar'
                      ? 'شكراً لتأكيدك! تم تسجيل أن المعلومات صحيحة.'
                      : 'Thank you for confirming! We have recorded that the information is correct.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Update Instructions */}
        {needsUpdate === true && (
          <Card className="border-2 border-orange-500 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className={clsx(
                    "text-base font-semibold text-orange-800 dark:text-orange-200 mb-2",
                    locale === 'ar' && 'text-right'
                  )}>
                    {locale === 'ar'
                      ? 'يمكنك الآن تحديث المعلومات'
                      : 'You can now update the information'}
                  </p>
                  <p className={clsx(
                    "text-sm text-orange-700 dark:text-orange-300",
                    locale === 'ar' && 'text-right'
                  )}>
                    {locale === 'ar'
                      ? 'انقر على زر "تمكين التعديل" في أي قسم لتحديث المعلومات الموجودة فيه.'
                      : 'Click the "Enable Editing" button in any section to update its information.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center flex-1">
                  <div className="p-3 bg-gray-100 rounded-xl me-4">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div>
                    <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>
                      {t.child.basic_information}
                    </span>
                    <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>
                      {locale === 'ar' ? 'المعلومات الشخصية الأساسية' : 'Personal identification and contact details'}
                    </p>
                  </div>
                </CardTitle>
                {needsUpdate === true && (
                  <Button
                    type="button"
                    variant={enabledSections.basicInfo ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleSection('basicInfo')}
                    className="ms-4"
                  >
                    {enabledSections.basicInfo ? (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {locale === 'ar' ? 'تعطيل التعديل' : 'Disable Editing'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {locale === 'ar' ? 'تمكين التعديل' : 'Enable Editing'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="givenName">{locale === 'ar' ? 'الاسم الأول (عربي)' : 'Given Name (Arabic)'}</Label>
                  <Input
                    id="givenName"
                    value={formData.givenName || ''}
                    onChange={(e) => handleInputChange('givenName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName">{locale === 'ar' ? 'اسم الأب (عربي)' : 'Middle Name (Arabic)'}</Label>
                  <Input
                    id="middleName"
                    value={formData.middleName || ''}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyName">{locale === 'ar' ? 'اسم العائلة (عربي)' : 'Family Name (Arabic)'}</Label>
                  <Input
                    id="familyName"
                    value={formData.familyName || ''}
                    onChange={(e) => handleInputChange('familyName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishFirstName">{locale === 'ar' ? 'الاسم الأول (إنجليزي)' : 'First Name (English)'}</Label>
                  <Input
                    id="englishFirstName"
                    value={formData.metadata?.englishFirstName || ''}
                    onChange={(e) => handleMetadataChange('englishFirstName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishSecondName">{locale === 'ar' ? 'الاسم الثاني (إنجليزي)' : 'Second Name (English)'}</Label>
                  <Input
                    id="englishSecondName"
                    value={formData.metadata?.englishSecondName || ''}
                    onChange={(e) => handleMetadataChange('englishSecondName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishFamilyName">{locale === 'ar' ? 'اسم العائلة (إنجليزي)' : 'Family Name (English)'}</Label>
                  <Input
                    id="englishFamilyName"
                    value={formData.metadata?.englishFamilyName || ''}
                    onChange={(e) => handleMetadataChange('englishFamilyName', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">{locale === 'ar' ? 'اسم المستخدم' : 'Username'}</Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-background"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center flex-1">
                  <div className="p-3 bg-slate-100 rounded-xl me-4">
                    <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>
                      {t.child.demographics_and_names}
                    </span>
                    <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>
                      {locale === 'ar' ? 'المعلومات الديموغرافية' : 'Personal demographics information'}
                    </p>
                  </div>
                </CardTitle>
                {needsUpdate === true && (
                  <Button
                    type="button"
                    variant={enabledSections.demographics ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleSection('demographics')}
                    className="ms-4"
                  >
                    {enabledSections.demographics ? (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {locale === 'ar' ? 'تعطيل التعديل' : 'Disable Editing'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {locale === 'ar' ? 'تمكين التعديل' : 'Enable Editing'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender">{locale === 'ar' ? 'الجنس' : 'Gender'}</Label>
                  <Input
                    id="gender"
                    value={formData.metadata?.gender || ''}
                    onChange={(e) => handleMetadataChange('gender', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate">{locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.metadata?.birthDate || ''}
                    onChange={(e) => handleMetadataChange('birthDate', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality">{locale === 'ar' ? 'الجنسية (إنجليزي)' : 'Nationality (English)'}</Label>
                  <Input
                    id="nationality"
                    value={formData.metadata?.nationality || ''}
                    onChange={(e) => handleMetadataChange('nationality', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalityArabic">{locale === 'ar' ? 'الجنسية (عربي)' : 'Nationality (Arabic)'}</Label>
                  <Input
                    id="nationalityArabic"
                    value={formData.metadata?.nationalityArabic || ''}
                    onChange={(e) => handleMetadataChange('nationalityArabic', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.demographics}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="bg-gradient-to-r from-primary/5 via-background to-primary/5 text-gray-900 border-b border-gray-200 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center flex-1">
                  <div className="p-3 bg-stone-100 rounded-xl me-4">
                    <svg className="w-6 h-6 text-stone-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <span className={`${locale === 'ar' ? 'text-lg font-semibold' : 'text-xl font-bold'}`}>
                      {t.child.primary_address}
                    </span>
                    <p className={`text-gray-600 ${locale === 'ar' ? 'text-xs' : 'text-sm'} font-normal mt-1`}>
                      {locale === 'ar' ? 'معلومات العنوان السكني' : 'Current residential address information'}
                    </p>
                  </div>
                </CardTitle>
                {needsUpdate === true && (
                  <Button
                    type="button"
                    variant={enabledSections.address ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleSection('address')}
                    className="ms-4"
                  >
                    {enabledSections.address ? (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {locale === 'ar' ? 'تعطيل التعديل' : 'Disable Editing'}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        {locale === 'ar' ? 'تمكين التعديل' : 'Enable Editing'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="country">{locale === 'ar' ? 'الدولة' : 'Country'}</Label>
                  <Input
                    id="country"
                    value={primaryAddress?.country || ''}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">{locale === 'ar' ? 'الإمارة' : 'State/Emirate'}</Label>
                  <Input
                    id="state"
                    value={primaryAddress?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{locale === 'ar' ? 'المدينة' : 'City'}</Label>
                  <Input
                    id="city"
                    value={primaryAddress?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">{locale === 'ar' ? 'المنطقة' : 'Region'}</Label>
                  <Input
                    id="region"
                    value={primaryAddress?.region || ''}
                    onChange={(e) => handleAddressChange('region', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">{locale === 'ar' ? 'القطاع' : 'Sector'}</Label>
                  <Input
                    id="sector"
                    value={primaryAddress?.sector || ''}
                    onChange={(e) => handleAddressChange('sector', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">{locale === 'ar' ? 'الرمز البريدي' : 'Zip Code'}</Label>
                  <Input
                    id="zipCode"
                    value={primaryAddress?.zipCode || ''}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poBox">{locale === 'ar' ? 'صندوق البريد' : 'PO Box'}</Label>
                  <Input
                    id="poBox"
                    value={primaryAddress?.poBox || ''}
                    onChange={(e) => handleAddressChange('poBox', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadNumber">{locale === 'ar' ? 'رقم الشارع' : 'Road Number'}</Label>
                  <Input
                    id="roadNumber"
                    value={primaryAddress?.roadNumber || ''}
                    onChange={(e) => handleAddressChange('roadNumber', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plotNumber">{locale === 'ar' ? 'رقم القطعة' : 'Plot Number'}</Label>
                  <Input
                    id="plotNumber"
                    value={primaryAddress?.plotNumber || ''}
                    onChange={(e) => handleAddressChange('plotNumber', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine1">{locale === 'ar' ? 'سطر العنوان 1' : 'Address Line 1'}</Label>
                  <Input
                    id="addressLine1"
                    value={primaryAddress?.addressLine1 || ''}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine2">{locale === 'ar' ? 'سطر العنوان 2' : 'Address Line 2'}</Label>
                  <Input
                    id="addressLine2"
                    value={primaryAddress?.addressLine2 || ''}
                    onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine3">{locale === 'ar' ? 'سطر العنوان 3' : 'Address Line 3'}</Label>
                  <Input
                    id="addressLine3"
                    value={primaryAddress?.addressLine3 || ''}
                    onChange={(e) => handleAddressChange('addressLine3', e.target.value)}
                    className="bg-background"
                    disabled={!enabledSections.address}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          {(needsUpdate === false || (needsUpdate === true && (enabledSections.basicInfo || enabledSections.demographics || enabledSections.address))) && (
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/80 p-4 -mx-3 sm:-mx-6 lg:-mx-8 rounded-t-xl shadow-lg">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {locale === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 me-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {needsUpdate === false 
                      ? (locale === 'ar' ? 'تأكيد البيانات' : 'Confirm Data')
                      : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                    }
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
