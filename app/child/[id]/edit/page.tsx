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
import { Badge } from '@/components/ui/badge';
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
    <div className={clsx("min-h-screen bg-gradient-to-br from-slate-50/50 via-background to-slate-50/50 dark:from-slate-950/50 dark:via-background dark:to-slate-950/50", locale === 'ar' && 'direction-rtl')}>
      {/* Enhanced Header with Progress */}
      <div className="sticky top-0 z-20 bg-background/98 backdrop-blur-xl border-b border-border/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-4">
            {/* Enhanced Breadcrumb Navigation */}
            <nav className="flex items-center space-x-1 rtl:space-x-reverse" aria-label="Breadcrumb">
              <Link 
                href="/dashboard" 
                className={clsx(
                  "group inline-flex items-center px-2 py-2 md:px-3 md:py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted/90 active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus:bg-muted",
                  "touch-manipulation select-none"
                )}
              >
                <svg className={clsx(
                  "w-4 h-4 me-1 md:me-2 transition-all duration-200 group-hover:scale-110 group-active:scale-95",
                  locale === 'ar' && 'rotate-180'
                )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-semibold text-xs hidden sm:inline">{locale === 'ar' ? 'الرئيسية' : 'Home'}</span>
              </Link>
              
              <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>

              <Link 
                href={`/child/${sourcedId}`}
                className={clsx(
                  "group inline-flex items-center px-2 py-2 md:px-3 md:py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  "text-muted-foreground hover:text-foreground hover:bg-muted/80 active:bg-muted/90 active:scale-95",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus:bg-muted",
                  "touch-manipulation select-none"
                )}
              >
                <span className="font-semibold text-xs">{locale === 'ar' ? 'ملف الطالب' : 'Student'}</span>
              </Link>
              
              <svg className="w-3 h-3 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={locale === 'ar' ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
              </svg>
              
              <div className="flex items-center px-2 py-2 md:px-3 bg-primary/10 rounded-xl">
                <svg className="w-3 h-3 me-1 md:me-1.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-xs font-bold text-primary">
                  {locale === 'ar' ? 'تعديل' : 'Edit'}
                </span>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8 space-y-6">
        {/* Enhanced Profile Header */}
        <div className="relative">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-card via-card to-card/95 overflow-hidden">
            {/* Decorative background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />
            
            <div className="relative px-4 py-6 md:px-8 md:py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                {/* Enhanced Avatar */}
                <div className="relative flex-shrink-0 group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/40 rounded-2xl md:rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />
                  <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary via-primary to-primary/90 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg ring-4 ring-background group-hover:scale-105 transition-transform duration-300">
                    <span className="text-3xl md:text-4xl font-bold text-primary-foreground">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {/* Status indicator */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-background rounded-full shadow-sm" />
                </div>
                
                {/* Student Information */}
                <div className={clsx("flex-1 min-w-0", locale === 'ar' && 'text-right')}>
                  <div className="mb-3 md:mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className={clsx(
                        "text-xl md:text-2xl font-bold text-foreground",
                        locale === 'ar' ? 'leading-relaxed' : 'leading-tight'
                      )}>
                        {locale === 'ar' ? 'تعديل معلومات الطالب' : 'Edit Student Information'}
                      </h1>
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        {locale === 'ar' ? 'نشط' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-semibold text-sm md:text-base">
                      {displayName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Data Confirmation Alert */}
        {needsUpdate === null && (
          <Card className="relative border-2 border-blue-500/50   bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-blue-100/80 dark:from-blue-950/80 dark:via-blue-950/50 dark:to-blue-900/80 backdrop-blur-sm overflow-hidden">
            {/* Animated background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-400/10 to-blue-400/0 animate-pulse" />
            
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-start gap-4 md:gap-6">
                {/* Animated icon */}
                <div className="flex-shrink-0">
                  <div className="relative w-14 h-14 md:w-20 md:h-20">
                    <div className="absolute inset-0 bg-blue-500 rounded-2xl animate-ping opacity-20" />
                    <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <svg className="w-7 h-7 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className={clsx(
                        "text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 flex-1",
                        locale === 'ar' && 'text-right'
                      )}>
                        {locale === 'ar' 
                          ? 'مراجعة وتأكيد البيانات - مهم جداً' 
                          : 'Review and Confirm Student Information - Very Important'}
                      </h3>
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 shrink-0">
                        {locale === 'ar' ? 'مطلوب' : 'Required'}
                      </Badge>
                    </div>
                    <p className={clsx(
                      "text-sm md:text-base text-gray-700 dark:text-gray-300",
                      locale === 'ar' && 'text-right leading-relaxed'
                    )}>
                      {locale === 'ar'
                        ? 'يرجى مراجعة معلومات الطالب أدناه بعناية. هذه المعلومات ضرورية للتواصل معكم وحفظ حقوق الطالب. هل المعلومات الموضحة صحيحة ومحدثة؟'
                        : 'Please carefully review the student information below. This information is essential for contacting you and protecting student rights. Is all the displayed information correct and up to date?'}
                    </p>
                  </div>
                  
                  <div className={clsx(
                    "bg-yellow-100/90 dark:bg-yellow-900/40 border-l-4 border-yellow-500 rounded-lg p-4 backdrop-blur-sm",
                    locale === 'ar' && 'text-right border-l-0 border-r-4'
                  )}>
                    <div className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-yellow-700 dark:text-yellow-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs md:text-sm text-yellow-900 dark:text-yellow-100 font-medium">
                        {locale === 'ar'
                          ? 'تنبيه: لا يمكنك التوقيع على اتفاقية قواعد السلوك إلا بعد تأكيد أو تحديث هذه المعلومات.'
                          : 'Notice: You cannot sign the Code of Conduct agreement until you confirm or update this information.'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      type="button"
                      onClick={handleConfirmCorrect}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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
                      className="flex-1 border-2 border-orange-500 bg-white dark:bg-slate-950 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 font-semibold py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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

        {/* Enhanced Success Confirmation Message */}
        {needsUpdate === false && (
          <Card className="relative border-2 border-green-500/50 shadow-2xl bg-gradient-to-br from-green-50/80 via-green-50/50 to-green-100/80 dark:from-green-950/80 dark:via-green-950/50 dark:to-green-900/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0" />
            
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="relative w-14 h-14 md:w-16 md:h-16">
                    <div className="absolute inset-0 bg-green-500 rounded-2xl opacity-20 animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-green-200 dark:ring-green-900">
                      <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <p className={clsx(
                        "text-lg md:text-xl font-bold text-green-900 dark:text-green-100 flex-1",
                        locale === 'ar' && 'text-right'
                      )}>
                        {locale === 'ar'
                          ? 'شكراً لتأكيدك! تم تسجيل أن المعلومات صحيحة.'
                          : 'Thank you for confirming! We have recorded that the information is correct.'}
                      </p>
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700 shrink-0">
                        <svg className="w-3 h-3 me-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {locale === 'ar' ? 'مؤكد' : 'Confirmed'}
                      </Badge>
                    </div>
                    <p className={clsx(
                      "text-sm md:text-base text-green-800 dark:text-green-200",
                      locale === 'ar' && 'text-right leading-relaxed'
                    )}>
                      {locale === 'ar'
                        ? 'يمكنك الآن المتابعة والتوقيع على اتفاقية قواعد السلوك.'
                        : 'You can now proceed to sign the Code of Conduct agreement.'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Update Instructions */}
        {needsUpdate === true && (
          <Card className="relative border-2 border-orange-500/50 shadow-2xl bg-gradient-to-br from-orange-50/80 via-orange-50/50 to-orange-100/80 dark:from-orange-950/80 dark:via-orange-950/50 dark:to-orange-900/80 backdrop-blur-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-400/10 to-orange-400/0" />
            
            <CardContent className="relative p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="relative w-14 h-14 md:w-16 md:h-16">
                    <div className="absolute inset-0 bg-orange-500 rounded-2xl opacity-20 animate-pulse" />
                    <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg ring-4 ring-orange-200 dark:ring-orange-900">
                      <svg className="w-7 h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="flex items-start gap-2 mb-2">
                      <p className={clsx(
                        "text-lg md:text-xl font-bold text-orange-900 dark:text-orange-100 flex-1",
                        locale === 'ar' && 'text-right'
                      )}>
                        {locale === 'ar'
                          ? 'يمكنك الآن تحديث المعلومات'
                          : 'You can now update the information'}
                      </p>
                      <Badge variant="default" className="bg-orange-600 hover:bg-orange-700 shrink-0">
                        {locale === 'ar' ? 'يحتاج تحديث' : 'Needs Update'}
                      </Badge>
                    </div>
                    <p className={clsx(
                      "text-sm md:text-base text-orange-800 dark:text-orange-200 mb-3",
                      locale === 'ar' && 'text-right leading-relaxed'
                    )}>
                      {locale === 'ar'
                        ? 'انقر على زر "تمكين التعديل" في أي قسم لتحديث المعلومات الموجودة فيه. يرجى التأكد من صحة جميع المعلومات حيث أنها مهمة للتواصل معكم.'
                        : 'Click the "Enable Editing" button in any section to update its information. Please ensure all information is accurate as it is essential for contacting you.'}
                    </p>
                  </div>
                  
                  <div className={clsx(
                    "bg-orange-200/80 dark:bg-orange-800/50 border-l-4 border-orange-600 rounded-lg p-3 backdrop-blur-sm",
                    locale === 'ar' && 'text-right border-l-0 border-r-4'
                  )}>
                    <p className="text-xs md:text-sm text-orange-900 dark:text-orange-100 font-semibold flex items-start gap-2">
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>
                        {locale === 'ar'
                          ? 'تذكير: لا يمكنك التوقيع على اتفاقية قواعد السلوك حتى تقوم بحفظ المعلومات المحدثة.'
                          : 'Reminder: You cannot sign the Code of Conduct agreement until you save the updated information.'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <Card className={clsx(
            "border-0 shadow-xl bg-card overflow-hidden transition-all duration-300",
            enabledSections.basicInfo && "ring-2 ring-primary/50 shadow-2xl"
          )}>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center flex-1 min-w-0">
                  <div className={clsx(
                    "p-3 rounded-2xl me-4 transition-all duration-300",
                    enabledSections.basicInfo 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 4-7 8-7s8 3 8 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx(
                        "font-bold",
                        locale === 'ar' ? 'text-base md:text-lg' : 'text-lg md:text-xl'
                      )}>
                        {t.child.basic_information}
                      </span>
                      {enabledSections.basicInfo && (
                        <Badge variant="default" className="bg-primary/90 animate-pulse">
                          {locale === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>
                    <p className={clsx(
                      "text-muted-foreground font-medium mt-1",
                      locale === 'ar' ? 'text-xs leading-relaxed' : 'text-sm'
                    )}>
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
                    className={clsx(
                      "shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md",
                      enabledSections.basicInfo ? "ring-2 ring-destructive/20" : "ring-2 ring-primary/20"
                    )}
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
                  <Label htmlFor="givenName" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الاسم الأول (عربي)' : 'Given Name (Arabic)'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="givenName"
                    value={formData.givenName || ''}
                    onChange={(e) => handleInputChange('givenName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-semibold">
                    {locale === 'ar' ? 'اسم الأب (عربي)' : 'Middle Name (Arabic)'}
                  </Label>
                  <Input
                    id="middleName"
                    value={formData.middleName || ''}
                    onChange={(e) => handleInputChange('middleName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="familyName" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'اسم العائلة (عربي)' : 'Family Name (Arabic)'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="familyName"
                    value={formData.familyName || ''}
                    onChange={(e) => handleInputChange('familyName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishFirstName" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الاسم الأول (إنجليزي)' : 'First Name (English)'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="englishFirstName"
                    value={formData.metadata?.englishFirstName || ''}
                    onChange={(e) => handleMetadataChange('englishFirstName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishSecondName" className="text-sm font-semibold">
                    {locale === 'ar' ? 'الاسم الثاني (إنجليزي)' : 'Second Name (English)'}
                  </Label>
                  <Input
                    id="englishSecondName"
                    value={formData.metadata?.englishSecondName || ''}
                    onChange={(e) => handleMetadataChange('englishSecondName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="englishFamilyName" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'اسم العائلة (إنجليزي)' : 'Family Name (English)'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="englishFamilyName"
                    value={formData.metadata?.englishFamilyName || ''}
                    onChange={(e) => handleMetadataChange('englishFamilyName', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'رقم الهاتف' : 'Phone'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.basicInfo 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.basicInfo}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'اسم المستخدم' : 'Username'}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {locale === 'ar' ? 'للقراءة فقط' : 'Read-only'}
                    </Badge>
                  </Label>
                  <Input
                    id="username"
                    value={formData.username || ''}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-muted/50 cursor-not-allowed"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Demographics Section */}
          <Card className={clsx(
            "border-0 shadow-xl bg-card overflow-hidden transition-all duration-300",
            enabledSections.demographics && "ring-2 ring-primary/50 shadow-2xl"
          )}>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center flex-1 min-w-0">
                  <div className={clsx(
                    "p-3 rounded-2xl me-4 transition-all duration-300",
                    enabledSections.demographics 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx(
                        "font-bold",
                        locale === 'ar' ? 'text-base md:text-lg' : 'text-lg md:text-xl'
                      )}>
                        {t.child.demographics_and_names}
                      </span>
                      {enabledSections.demographics && (
                        <Badge variant="default" className="bg-primary/90 animate-pulse">
                          {locale === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>
                    <p className={clsx(
                      "text-muted-foreground font-medium mt-1",
                      locale === 'ar' ? 'text-xs leading-relaxed' : 'text-sm'
                    )}>
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
                    className={clsx(
                      "shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md",
                      enabledSections.demographics ? "ring-2 ring-destructive/20" : "ring-2 ring-primary/20"
                    )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الجنس' : 'Gender'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="gender"
                    value={formData.metadata?.gender || ''}
                    onChange={(e) => handleMetadataChange('gender', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.demographics 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'تاريخ الميلاد' : 'Birth Date'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.metadata?.birthDate || ''}
                    onChange={(e) => handleMetadataChange('birthDate', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.demographics 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationality" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الجنسية (إنجليزي)' : 'Nationality (English)'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nationality"
                    value={formData.metadata?.nationality || ''}
                    onChange={(e) => handleMetadataChange('nationality', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.demographics 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.demographics}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalityArabic" className="text-sm font-semibold">
                    {locale === 'ar' ? 'الجنسية (عربي)' : 'Nationality (Arabic)'}
                  </Label>
                  <Input
                    id="nationalityArabic"
                    value={formData.metadata?.nationalityArabic || ''}
                    onChange={(e) => handleMetadataChange('nationalityArabic', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.demographics 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.demographics}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card className={clsx(
            "border-0 shadow-xl bg-card overflow-hidden transition-all duration-300",
            enabledSections.address && "ring-2 ring-primary/50 shadow-2xl"
          )}>
            <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border/50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <CardTitle className="flex items-center flex-1 min-w-0">
                  <div className={clsx(
                    "p-3 rounded-2xl me-4 transition-all duration-300",
                    enabledSections.address 
                      ? "bg-primary text-primary-foreground shadow-lg" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={clsx(
                        "font-bold",
                        locale === 'ar' ? 'text-base md:text-lg' : 'text-lg md:text-xl'
                      )}>
                        {t.child.primary_address}
                      </span>
                      {enabledSections.address && (
                        <Badge variant="default" className="bg-primary/90 animate-pulse">
                          {locale === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      )}
                    </div>
                    <p className={clsx(
                      "text-muted-foreground font-medium mt-1",
                      locale === 'ar' ? 'text-xs leading-relaxed' : 'text-sm'
                    )}>
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
                    className={clsx(
                      "shrink-0 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md",
                      enabledSections.address ? "ring-2 ring-destructive/20" : "ring-2 ring-primary/20"
                    )}
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
                {/* Primary Location Fields */}
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الدولة' : 'Country'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="country"
                    value={primaryAddress?.country || ''}
                    onChange={(e) => handleAddressChange('country', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'الإمارة' : 'State/Emirate'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="state"
                    value={primaryAddress?.state || ''}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold flex items-center gap-1">
                    {locale === 'ar' ? 'المدينة' : 'City'}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={primaryAddress?.city || ''}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                {/* Secondary Location Fields */}
                <div className="space-y-2">
                  <Label htmlFor="region" className="text-sm font-semibold">
                    {locale === 'ar' ? 'المنطقة' : 'Region'}
                  </Label>
                  <Input
                    id="region"
                    value={primaryAddress?.region || ''}
                    onChange={(e) => handleAddressChange('region', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector" className="text-sm font-semibold">
                    {locale === 'ar' ? 'القطاع' : 'Sector'}
                  </Label>
                  <Input
                    id="sector"
                    value={primaryAddress?.sector || ''}
                    onChange={(e) => handleAddressChange('sector', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-semibold">
                    {locale === 'ar' ? 'الرمز البريدي' : 'Zip Code'}
                  </Label>
                  <Input
                    id="zipCode"
                    value={primaryAddress?.zipCode || ''}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                {/* Additional Details */}
                <div className="space-y-2">
                  <Label htmlFor="poBox" className="text-sm font-semibold">
                    {locale === 'ar' ? 'صندوق البريد' : 'PO Box'}
                  </Label>
                  <Input
                    id="poBox"
                    value={primaryAddress?.poBox || ''}
                    onChange={(e) => handleAddressChange('poBox', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roadNumber" className="text-sm font-semibold">
                    {locale === 'ar' ? 'رقم الشارع' : 'Road Number'}
                  </Label>
                  <Input
                    id="roadNumber"
                    value={primaryAddress?.roadNumber || ''}
                    onChange={(e) => handleAddressChange('roadNumber', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plotNumber" className="text-sm font-semibold">
                    {locale === 'ar' ? 'رقم القطعة' : 'Plot Number'}
                  </Label>
                  <Input
                    id="plotNumber"
                    value={primaryAddress?.plotNumber || ''}
                    onChange={(e) => handleAddressChange('plotNumber', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                {/* Full Address Lines */}
                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine1" className="text-sm font-semibold">
                    {locale === 'ar' ? 'سطر العنوان 1' : 'Address Line 1'}
                  </Label>
                  <Input
                    id="addressLine1"
                    value={primaryAddress?.addressLine1 || ''}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine2" className="text-sm font-semibold">
                    {locale === 'ar' ? 'سطر العنوان 2' : 'Address Line 2'}
                  </Label>
                  <Input
                    id="addressLine2"
                    value={primaryAddress?.addressLine2 || ''}
                    onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>

                <div className="space-y-2 md:col-span-2 lg:col-span-3">
                  <Label htmlFor="addressLine3" className="text-sm font-semibold">
                    {locale === 'ar' ? 'سطر العنوان 3' : 'Address Line 3'}
                  </Label>
                  <Input
                    id="addressLine3"
                    value={primaryAddress?.addressLine3 || ''}
                    onChange={(e) => handleAddressChange('addressLine3', e.target.value)}
                    className={clsx(
                      "transition-all duration-200",
                      enabledSections.address 
                        ? "bg-background border-primary/50 focus:border-primary focus:ring-primary/20" 
                        : "bg-muted/50"
                    )}
                    disabled={!enabledSections.address}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Form Actions */}
          {(needsUpdate === false || (needsUpdate === true && (enabledSections.basicInfo || enabledSections.demographics || enabledSections.address))) && (
            <div className="sticky bottom-0 z-10 bg-gradient-to-t from-background via-background/98 to-background/95 backdrop-blur-xl border-t border-border/80 shadow-2xl -mx-3 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto py-4 md:py-6">
                <div className="flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4 justify-end">
                  {/* Action Buttons */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSaving}
                      className="w-full sm:w-auto min-w-[140px] h-11 font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4 me-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {locale === 'ar' ? 'إلغاء' : 'Cancel'}
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="w-full sm:w-auto min-w-[180px] h-11 font-bold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                    >
                      {isSaving ? (
                        <>
                          <svg className="w-5 h-5 me-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 me-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          {needsUpdate === false 
                            ? (locale === 'ar' ? 'تأكيد البيانات' : 'Confirm Data')
                            : (locale === 'ar' ? 'حفظ التغييرات' : 'Save Changes')
                          }
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
