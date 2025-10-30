'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { jsonFetcher } from '@/lib/swr';
import { useI18n } from '@/app/i18n/I18nProvider';
import { downloadBase64PDF, type PdfFormData } from '@/lib/pdf-generator';
import {
  type ParentConductAggregatedResponse,
  type UpdateInfoRow,
} from '@/lib/parent-conduct';
import type { StudentProfileV1 } from '@/app/types/studentprofile';

type SchoolContact = {
  note: string;
  contactType: string;
  isPrivate: boolean;
  value: string;
};

type SchoolAddress = {
  country: string;
  zipCode: string;
  city: string;
  isVerified: boolean;
  latitude: string;
  poBox: string;
  roadNumber: string;
  plotId: string;
  addressLine1: string;
  plotNumber: string;
  addressLine2: string;
  addressLine3: string;
  state: string;
  region: string;
  sector: string;
  longitude: string;
};

type SchoolMetadata = {
  shortName: string;
  contacts: SchoolContact[];
  addresses: SchoolAddress[];
  englishName: string;
};

type SchoolInfo = {
  sourcedId: string;
  identifier: string;
  metadata: SchoolMetadata;
  name: string;
  meta?: {
    cache?: {
      source: string;
      lastUpdated: string | null;
    };
  };
};

type AggregatedApiResponse = {
  ok: boolean;
  data?: ParentConductAggregatedResponse;
  error?: string;
  meta?: { aggregatedAt: string };
};

const PLACEHOLDER = '—';
const CONDUCT_DATA_ENDPOINT = '/api/parent/conduct';
const GENERATE_CONDUCT_PDF_ENDPOINT = '/api/parent/generate-conduct-pdf';
const UPDATE_INFORMATION_ENDPOINT = '/api/parent/update-information-requests';
const PDF_CHUNK_SIZE = 500_000;

type PdfRequestBody = PdfFormData & { template?: 'uae' | 'expats' };

type GeneratePdfResult = {
  base64: string;
  filename: string;
};

type PersistPayload = {
  studentPersonId: string;
  parentPersonId?: string | null;
  studentEmirateId?: string | null;
  citizenship?: string | null;
};

async function requestConductPdf(body: PdfRequestBody): Promise<GeneratePdfResult> {
  const response = await fetch(GENERATE_CONDUCT_PDF_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json || typeof json.base64 !== 'string') {
    const message = json && typeof json.error === 'string' ? json.error : 'Failed to generate PDF';
    throw new Error(message);
  }

  const filename =
    typeof json.filename === 'string' && json.filename.trim().length > 0
      ? json.filename
      : `${body.Name || 'Document'}_ParentConduct.pdf`;

  return { base64: json.base64, filename };
}

async function persistConductAgreement(basePayload: PersistPayload, base64: string): Promise<void> {
  if (!base64) return;

  const baseRequest = {
    studentPersonId: basePayload.studentPersonId,
    parentPersonId: basePayload.parentPersonId ?? null,
    studentEmirateId: basePayload.studentEmirateId ?? null,
    citizenship: basePayload.citizenship ?? null,
  };

  const primaryResponse = await fetch(UPDATE_INFORMATION_ENDPOINT, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...baseRequest,
      isConductAgreementSigned: true,
      conductAgreementStatus: 1,
      pdfBase64: base64,
    }),
  });

  if (primaryResponse.ok) {
    return;
  }

  const totalChunks = Math.ceil(base64.length / PDF_CHUNK_SIZE);
  if (totalChunks <= 1) {
    const errorText = await primaryResponse.text().catch(() => 'Failed to persist conduct agreement');
    throw new Error(errorText || 'Failed to persist conduct agreement');
  }

  for (let index = 0; index < totalChunks; index++) {
    const chunk = base64.slice(index * PDF_CHUNK_SIZE, (index + 1) * PDF_CHUNK_SIZE);
    const chunkResponse = await fetch(UPDATE_INFORMATION_ENDPOINT, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...baseRequest,
        chunk,
        chunkIndex: index,
        totalChunks,
      }),
    });

    if (!chunkResponse.ok) {
      const errorText = await chunkResponse.text().catch(() => `Chunk upload failed at index ${index}`);
      throw new Error(errorText || `Chunk upload failed at index ${index}`);
    }
  }
}

function InfoField({
  label,
  value,
  span = 1,
  mono = false,
}: {
  label: string;
  value?: React.ReactNode;
  span?: 1 | 2;
  mono?: boolean;
}) {
  return (
    <div className={`space-y-2 ${span === 2 ? 'md:col-span-2' : ''}`}>
      <div className="block text-sm font-medium text-foreground mb-1">{label}</div>
      <div className={`bg-muted rounded px-3 py-2 text-sm ${mono ? 'font-mono' : ''}`}>
        {value ?? PLACEHOLDER}
      </div>
    </div>
  );
}

export default function ParentConductPage() {
  const { t, locale } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const routeChildId = params?.id as string | undefined;
  const queryStudentId = searchParams.get('studentId') || undefined;
  const resolvedStudentId = queryStudentId || routeChildId || '';

  const [currentStep, setCurrentStep] = React.useState(1);
  const [isAgreed, setIsAgreed] = React.useState(false);
  const [isSigned, setIsSigned] = React.useState(false);
  const [isSigning, setIsSigning] = React.useState(false);
  const [latestPdfBase64, setLatestPdfBase64] = React.useState<string | null>(null);

  const dataKey = resolvedStudentId
    ? `${CONDUCT_DATA_ENDPOINT}?studentPersonId=${encodeURIComponent(resolvedStudentId)}&schoolYear=2026`
    : null;
  const {
    data: aggregatedResponse,
    error: aggregatedError,
    isLoading,
    mutate,
  } = useSWR<AggregatedApiResponse>(dataKey, jsonFetcher);

  const aggregated = aggregatedResponse?.data ?? null;
  const apiErrorMessage =
    aggregatedResponse && aggregatedResponse.ok === false
      ? aggregatedResponse.error
      : aggregatedError instanceof Error
        ? aggregatedError.message
        : aggregatedError
          ? String(aggregatedError)
          : undefined;
  const hasFetchError = Boolean(apiErrorMessage);

  const studentInfo = aggregated?.studentInfo ?? null;
  const updateInfo = aggregated?.updateInfo ?? null;
  const schoolInfo = aggregated?.schoolInfo as SchoolInfo | null;

  // Helper functions for StudentProfileV1
  const isStudentProfile = (data: any): data is StudentProfileV1 => {
    return data && typeof data === 'object' && 'enrollment' in data;
  };

  // Extract student data from PP API response
  const student = React.useMemo(() => {
    if (!studentInfo || !isStudentProfile(studentInfo)) return null;
    return studentInfo;
  }, [studentInfo]);

  const studentFullName = React.useMemo(() => {
    if (!student) return PLACEHOLDER;
    if (locale === 'ar') {
      const arabicName = [
        student.firstNameArabic,
        student.middleNameArabic,
        student.lastNameArabic,
      ].filter(Boolean).join(' ').trim();
      if (arabicName) return arabicName;
    }
    const englishName = [
      student.firstNameEnglish,
      student.middleNameEnglish,
      student.thirdNameEnglish,
      student.fourthNameEnglish,
      student.familyNameEnglish,
    ].filter(Boolean).join(' ').trim();
    return englishName || PLACEHOLDER;
  }, [student, locale]);

  const studentNationalId = student?.emirateId || PLACEHOLDER;
  
  const studentAddress = React.useMemo(() => {
    if (!student?.addresses?.length) return PLACEHOLDER;
    const address = student.addresses[0];
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      address.city,
      address.state,
      address.country,
    ].filter(Boolean).join(', ');
    return parts || PLACEHOLDER;
  }, [student]);

  const studentContacts = React.useMemo(() => {
    if (!student?.contacts) return { phone: undefined, email: undefined };
    const mobile = student.contacts.find(c => c.type === 'Mobile' || c.type.toLowerCase().includes('mobile'));
    const email = student.contacts.find(c => c.type === 'Email' || c.type === 'OfficialEmail');
    return {
      phone: mobile?.value,
      email: email?.value,
    };
  }, [student]);

  const latestEnrollment = React.useMemo(() => {
    if (!student?.enrollment?.length) return null;
    // Get the most recent enrollment (last in array or highest entryDate)
    return student.enrollment.reduce((latest, current) => {
      if (!latest) return current;
      const currentDate = current.entryDate ? new Date(current.entryDate).getTime() : 0;
      const latestDate = latest.entryDate ? new Date(latest.entryDate).getTime() : 0;
      return currentDate > latestDate ? current : latest;
    });
  }, [student]);

  const citizenship = student?.CitizenshipStatus || null;
  const isExpatCitizenship = React.useMemo(() => {
    const c = (citizenship ?? '').trim().toLowerCase();
    return c === 'expat arab' || c === 'expat non arab';
  }, [citizenship]);

  // Extract parent information from student profile
  const parentInfo = student?.parent ?? null;
  
  const parentFullName = React.useMemo(() => {
    if (!parentInfo) return PLACEHOLDER;
    if (locale === 'ar') {
      const arabicName = [
        parentInfo.givenName,
        parentInfo.middleName,
        parentInfo.familyName,
      ].filter(Boolean).join(' ').trim();
      if (arabicName) return arabicName;
    }
    const englishName = [
      parentInfo.englishFirstName,
      parentInfo.englishSecondName,
      parentInfo.englishThirdName,
      parentInfo.englishFamilyName,
    ].filter(Boolean).join(' ').trim();
    return englishName || PLACEHOLDER;
  }, [parentInfo, locale]);

  const parentEid = parentInfo?.identifier || PLACEHOLDER;
  
  const parentContacts = React.useMemo(() => {
    if (!parentInfo?.contacts) return { phone: undefined, email: undefined };
    const mobile = parentInfo.contacts.find(c => c.type === 'Mobile' || c.type.toLowerCase().includes('mobile'));
    const email = parentInfo.contacts.find(c => c.type === 'Email' || c.type === 'OfficialEmail');
    return {
      phone: mobile?.value,
      email: email?.value,
    };
  }, [parentInfo]);
  
  // Extract school information from API response
  const schoolName = React.useMemo(() => {
    if (!schoolInfo) return latestEnrollment?.schoolId || PLACEHOLDER;
    if (locale === 'ar') {
      return schoolInfo.name || schoolInfo.metadata?.englishName || PLACEHOLDER;
    }
    return schoolInfo.metadata?.englishName || schoolInfo.name || PLACEHOLDER;
  }, [schoolInfo, latestEnrollment, locale]);

  const schoolYearLabel = latestEnrollment?.schoolYear || PLACEHOLDER;
  
  const schoolAddress = React.useMemo(() => {
    if (!schoolInfo?.metadata?.addresses?.length) return PLACEHOLDER;
    const address = schoolInfo.metadata.addresses[0];
    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      address.city,
      address.state,
      address.country,
    ].filter(Boolean).join(', ');
    return parts || PLACEHOLDER;
  }, [schoolInfo]);
  
  const schoolContact = React.useMemo(() => {
    if (!schoolInfo?.metadata?.contacts?.length) {
      return { phone: undefined, email: undefined };
    }
    
    let phone: string | undefined;
    let email: string | undefined;
    
    for (const contact of schoolInfo.metadata.contacts) {
      const type = contact.contactType?.toLowerCase() || '';
      
      if (!email && (type.includes('email') || contact.value.includes('@'))) {
        email = contact.value;
      }
      
      if (!phone && (type.includes('phone') || type.includes('mobile') || type.includes('tel'))) {
        phone = contact.value;
      }
      
      if (phone && email) break;
    }
    
    return { phone, email };
  }, [schoolInfo]);
  
  const latestStreamGradeName = latestEnrollment?.streamGradeId || PLACEHOLDER;

  const signedRow: UpdateInfoRow | undefined = updateInfo?.ok ? updateInfo.data : undefined;
  const warningMessage = null;
  const alreadySigned = Boolean(
    signedRow?.isConductAgreementSigned &&
      signedRow?.conductAgreementStatus === 1 &&
      signedRow?.pdfBase64 &&
      signedRow.pdfBase64.length > 20,
  );

  React.useEffect(() => {
    if (signedRow?.pdfBase64) {
      setLatestPdfBase64(signedRow.pdfBase64);
    }
  }, [signedRow?.pdfBase64]);

  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-US');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, []);

  const handleGeneratePDF = React.useCallback(
    async ({ autoDownload = false }: { autoDownload?: boolean } = {}) => {
      const pdfData: PdfFormData = {
        SchoolName: schoolName !== PLACEHOLDER ? schoolName : '',
        SchoolAddress: schoolAddress !== PLACEHOLDER ? schoolAddress : '',
        SchoolPhone: schoolContact.phone || '',
        Name: studentFullName !== PLACEHOLDER ? studentFullName : '',
        StudentEmiratesID: studentNationalId !== PLACEHOLDER ? studentNationalId : '',
        ParentName: parentFullName !== PLACEHOLDER ? parentFullName : '',
        ParentEmiratesID: parentEid !== PLACEHOLDER ? parentEid : '',
        Phone: parentContacts.phone || '',
        Address: '',
        SignDate: today,
      };

      let templateType: 'uae' | 'expats' = 'uae';
      if (citizenship === 'Expat Arab' || citizenship === 'Expat non Arab') {
        templateType = 'expats';
      } else {
        templateType = 'uae';
      }

      const template: PdfRequestBody['template'] = templateType;
      const { base64, filename } = await requestConductPdf({ ...pdfData, template });

      if (autoDownload) {
        downloadBase64PDF(base64, filename);
      }

      return { base64, filename };
    },
    [
      parentContacts.phone,
      parentEid,
      parentFullName,
      schoolAddress,
      schoolContact.phone,
      schoolName,
      studentFullName,
      studentNationalId,
      today,
      citizenship,
    ],
  );

  const handleManualDownload = React.useCallback(async () => {
    try {
      if (latestPdfBase64) {
        downloadBase64PDF(latestPdfBase64, `${studentFullName}_ParentConduct.pdf`);
        return;
      }

      const { base64, filename } = await handleGeneratePDF();
      setLatestPdfBase64(base64);
      downloadBase64PDF(base64, filename || `${studentFullName}_ParentConduct.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  }, [handleGeneratePDF, latestPdfBase64, studentFullName]);

  const handleSign = React.useCallback(async () => {
    if (!resolvedStudentId || !isAgreed || isSigning) return;

    setIsSigning(true);
    try {
      const { base64 } = await handleGeneratePDF({ autoDownload: true });
      setLatestPdfBase64(base64);

      setIsSigned(true);
      await persistConductAgreement(
        {
          studentPersonId: resolvedStudentId,
          parentPersonId: null,
          studentEmirateId: studentNationalId !== PLACEHOLDER ? studentNationalId : null,
          citizenship: citizenship ?? null,
        },
        base64,
      );

      const notifyParent = async () => {
        if (!base64) return;

        const emailRecipient = parentContacts.email?.trim();
        const smsRecipient = parentContacts.phone?.trim();

        const sendEmail = async () => {
          if (!emailRecipient) return;

          const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              pdf64: base64,
              to: emailRecipient,
            }),
          });

          if (!response.ok) {
            const message = await response.text().catch(() => response.statusText);
            throw new Error(message || 'Email notification failed');
          }
        };

        const sendSms = async () => {
          if (!smsRecipient) return;

          const response = await fetch('/api/notifications/sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ recipient: smsRecipient }),
          });

          if (!response.ok) {
            const message = await response.text().catch(() => response.statusText);
            throw new Error(message || 'SMS notification failed');
          }
        };

        const tasks: Array<Promise<void>> = [];
        if (emailRecipient) tasks.push(sendEmail());
        if (smsRecipient) tasks.push(sendSms());

        if (!tasks.length) {
          console.warn('No parent contact info available for notifications.');
          return;
        }

        const results = await Promise.allSettled(tasks);
        results.forEach((result) => {
          if (result.status === 'rejected') {
            console.error('Parent conduct notification failed:', result.reason);
          }
        });
      };

      await notifyParent();

      if (typeof mutate === 'function') {
        void mutate();
      }
    } catch (error) {
      console.error('Error completing conduct signature:', error);
      alert(
        'Charter signed successfully, but saving the agreement failed. It will retry on next visit.',
      );
    } finally {
      setIsSigning(false);
    }
  }, [
    handleGeneratePDF,
    isAgreed,
    isSigning,
    mutate,
    parentContacts.email,
    parentContacts.phone,
    resolvedStudentId,
    studentNationalId,
    citizenship,
  ]);

  if (!resolvedStudentId) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {t.parentConduct.noStudentId}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner variant="education" text={t.parentConduct.loading} />
      </div>
    );
  }

  if (hasFetchError) {
    const message = apiErrorMessage ?? t.parentConduct.errorLoading;
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {message}
      </div>
    );
  }

  if (warningMessage) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center">
        <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded p-4">
          {warningMessage}
        </div>
      </div>
    );
  }

  if (alreadySigned && signedRow?.pdfBase64) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <Card className="mb-6 border shadow-md">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-500 text-white">
            <CardTitle className="text-center text-lg sm:text-xl font-semibold">
              {locale === 'ar' ? 'تم توقيع ميثاق السلوك بنجاح' : 'Parent Conduct Charter Completed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-foreground mb-1">
                  {locale === 'ar'
                    ? 'تم إنجاز عملية التوقيع وحفظ نسخة PDF'
                    : 'The charter has been signed and a PDF copy is stored.'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {locale === 'ar'
                    ? 'يمكنك تنزيل نسخة الـ PDF في أي وقت.'
                    : 'You can download the PDF copy anytime.'}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => downloadBase64PDF(signedRow.pdfBase64 as string, `${studentFullName}_ParentConduct.pdf`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {locale === 'ar' ? 'تحميل PDF' : 'Download PDF'}
              </button>

              <Link href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}>
                <button className="px-6 py-3 rounded-lg border bg-muted text-foreground" type="button">
                  {t.parentConduct.navigation.close}
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const conductTerms = t.parentConduct.conductTerms;
  // Only show the last Parent Commitments section (Tuition Fees for Non-Citizens)
  // when citizenship is Expat Arab or Expat non Arab.
  const parentSectionsAll = conductTerms.parentCommitments.sections;
  const parentSections = isExpatCitizenship
    ? parentSectionsAll
    : parentSectionsAll.slice(0, Math.max(0, parentSectionsAll.length - 1));

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4 ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.parentConduct.backButton}
        </Link>
        <div className="text-xs text-muted-foreground">
          <span>{t.parentConduct.progressLabels.current} {currentStep} {t.parentConduct.progressLabels.of} 4</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{t.parentConduct.progress}</span>
          <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>{t.parentConduct.steps.schoolInfo}</span>
          <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>{t.parentConduct.steps.parentInfo}</span>
          <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>{t.parentConduct.steps.terms}</span>
          <span className={currentStep >= 4 ? 'text-primary font-medium' : ''}>{t.parentConduct.steps.signature}</span>
        </div>
      </div>

      {/* Header */}
      <Card className="mb-8 border shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
          <CardTitle className="text-center text-lg sm:text-xl font-semibold">
            {t.parentConduct.title}
          </CardTitle>
          <p className="text-center text-primary-foreground/80 mt-2 text-sm">
            {t.parentConduct.subtitle}
          </p>
        </CardHeader>
        <CardContent className="pt-6 text-foreground leading-6">
          <div className="bg-muted border-r-4 border-primary p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-3 flex items-center text-sm">
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.parentConduct.introduction.title}
            </h3>
            <p className="mb-3 text-muted-foreground text-sm">
              {t.parentConduct.introduction.paragraph1}
            </p>
            <p className="text-muted-foreground text-sm">
              {t.parentConduct.introduction.paragraph2}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Step 1: School Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-lg flex items-center text-secondary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1" />
                </svg>
                {t.parentConduct.schoolSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label={t.parentConduct.schoolSection.schoolName} value={schoolName} />
                <InfoField label={t.parentConduct.schoolSection.schoolYear} value={schoolYearLabel} />
                <InfoField label={t.parentConduct.schoolSection.address} value={schoolAddress} span={2} />
                <InfoField label={t.parentConduct.schoolSection.phone} value={schoolContact.phone || PLACEHOLDER} />
                <InfoField label={t.parentConduct.schoolSection.email} value={schoolContact.email || PLACEHOLDER} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Parent Information */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/70 to-primary/80 border-b">
              <CardTitle className="text-lg flex items-center text-primary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t.parentConduct.parentSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary-foreground/80">{t.parentConduct.parentSection.parentData}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label={t.parentConduct.parentSection.parentName} value={parentFullName} />
                    <InfoField label={t.parentConduct.parentSection.parentNationalId} value={parentEid} mono />
                    <InfoField label={t.parentConduct.parentSection.contactNumber} value={parentContacts.phone || PLACEHOLDER} />
                    <InfoField label={t.parentConduct.parentSection.parentEmail} value={parentContacts.email || PLACEHOLDER} />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary-foreground/80">{t.parentConduct.parentSection.linkedStudentData}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label={t.parentConduct.parentSection.studentFullName} value={studentFullName} />
                    <InfoField label={t.parentConduct.schoolSection.nationalId} value={studentNationalId} mono />
                    <InfoField label={t.parentConduct.parentSection.parentAddress} value={studentAddress} span={2} />
                    <InfoField label={t.parentConduct.parentSection.contactNumber} value={studentContacts.phone || PLACEHOLDER} />
                    <InfoField label={t.parentConduct.parentSection.parentEmail} value={studentContacts.email || PLACEHOLDER} />
                  </div>
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: Conduct Terms */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Validity Period */}
          <Card className="border border-primary/20 shadow-md bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-foreground">{t.parentConduct.termsSection.validityTitle}</h4>
                  <p className="text-muted-foreground">{conductTerms.validityPeriod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* School Commitments */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-base flex items-center text-secondary-foreground">
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 8h1m-1-4h1" />
                </svg>
                {t.parentConduct.termsSection.schoolCommitmentsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                {conductTerms.schoolCommitments.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <span className="w-5 h-5 bg-secondary/20 text-secondary-foreground rounded-full flex items-center justify-center text-xs font-bold ml-2">
                        {sectionIndex + 1}
                      </span>
                      {section.title}
                    </h4>
                    <ul className="space-y-1 pr-7">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-muted-foreground text-xs leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-secondary rounded-full mt-1.5 ml-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Parent Commitments */}
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-primary/60 to-primary/70 border-b">
              <CardTitle className="text-base flex items-center text-primary-foreground">
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t.parentConduct.termsSection.parentCommitmentsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                {parentSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 last:mb-0">
                    <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
                      <span className="w-5 h-5 bg-primary/20 text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold ml-2">
                        {sectionIndex + 1}
                      </span>
                      {section.title}
                    </h4>
                    <ul className="space-y-1 pr-7">
                      {section.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start text-muted-foreground text-xs leading-relaxed">
                          <span className="flex-shrink-0 w-1.5 h-1.5 bg-primary rounded-full mt-1.5 ml-2"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Signature */}
      {currentStep === 4 && (
        <div className="space-y-6">
          <Card className="border shadow-md">
            <CardHeader className="bg-gradient-to-r from-secondary/10 to-secondary/20 border-b">
              <CardTitle className="text-lg flex items-center text-secondary-foreground">
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.parentConduct.signatureSection.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Summary Information */}
              <div className="bg-muted border rounded-lg p-3 mb-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">{t.parentConduct.signatureSection.summaryTitle}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><span className="font-medium">{t.parentConduct.signatureSection.school}</span> {schoolName}</div>
                  <div><span className="font-medium">{t.parentConduct.signatureSection.student}</span> {studentFullName}</div>
                  <div><span className="font-medium">{t.parentConduct.signatureSection.parent}</span> {parentFullName}</div>
                  <div><span className="font-medium">{t.parentConduct.signatureSection.grade}</span> {latestStreamGradeName || PLACEHOLDER}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-accent/20 border border-accent rounded-lg">
                  <div className="text-xs text-muted-foreground leading-relaxed mb-4">
                    <span className="font-medium text-foreground block mb-2">{t.parentConduct.signatureSection.parentDeclaration}</span>
                    {t.parentConduct.signatureSection.declarationText}
                  </div>
                  
                  <div className="flex items-start gap-3 mt-4 p-3 bg-background rounded border">
                    <input
                      type="checkbox"
                      id="agree-checkbox"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      disabled={isSigned || isSigning}
                    />
                    <label htmlFor="agree-checkbox" className="text-sm text-foreground cursor-pointer">
                      {locale === 'ar' 
                        ? 'أوافق على جميع بنود وشروط ميثاق الشراكة بين المدرسة وولي الأمر وأتعهد بالالتزام بها.'
                        : 'I agree to all terms and conditions of the partnership charter between the school and parent and commit to abide by them.'}
                    </label>
                  </div>

                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={handleSign}
                      disabled={!isAgreed || isSigned || isSigning}
                      className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all ${
                        !isAgreed || isSigned || isSigning
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                      }`}
                    >
                      {isSigned
                        ? locale === 'ar'
                          ? '✓ تم التوقيع'
                          : '✓ Signed'
                        : isSigning
                          ? locale === 'ar'
                            ? 'جاري التوقيع...'
                            : 'Signing...'
                          : locale === 'ar'
                            ? 'توقيع الميثاق'
                            : 'Sign Charter'}
                    </button>

                    {isSigned && (
                      <button
                        type="button"
                        onClick={handleManualDownload}
                        className="w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {locale === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                      </button>
                    )}
                    
                    {!isAgreed && !isSigned && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {locale === 'ar' 
                          ? 'يرجى الموافقة على الشروط للمتابعة'
                          : 'Please agree to the terms to proceed'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mt-4">
                  <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-secondary rounded-lg py-6 bg-secondary/10">
                    <svg className="w-8 h-8 text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-secondary-foreground text-xs mb-1">{t.parentConduct.signatureSection.ministryStamp}</div>
                    <div className="text-lg font-bold text-secondary-foreground">{t.parentConduct.signatureSection.approved}</div>
                  </div>
                  <div>
                    <div className="block text-xs font-medium text-foreground mb-2">{t.parentConduct.signatureSection.date}</div>
                    <div className="bg-muted text-center font-medium text-sm rounded px-3 py-2">{today}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 pt-6 border-t">
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button 
              type="button" 
              className="px-4 py-2 border rounded bg-white hover:bg-muted text-foreground"
              onClick={handlePrevious}
            >
              {t.parentConduct.navigation.previous}
            </button>
          )}
          <Link href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}>
            <button className="px-4 py-2 border rounded bg-muted text-foreground" type="button">{t.parentConduct.navigation.close}</button>
          </Link>
        </div>
        <div className="flex gap-3">
          {currentStep < 4 && (
            <button 
              type="button" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded"
              onClick={handleNext}
            >
              {t.parentConduct.navigation.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
