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
import { useToastNotifications } from '@/lib/hooks/use-toast-notifications';
import {
  type ParentConductAggregatedResponse,
  extractOrgFromAny,
  extractSchoolContact,
  formatOrgAddress,
  resolveSchoolName,
} from '@/lib/parent-conduct';
import type { StudentProfileV1 } from '@/app/types/studentprofile';
import type { Org } from '@/types';

type AggregatedApiResponse = {
  ok: boolean;
  data?: ParentConductAggregatedResponse;
  error?: string;
  meta?: { aggregatedAt: string };
};

type CharterStatusResponse = {
  ok: boolean;
  data?: {
    academicyear?: string;
    studentNumber?: string;
    attachment01?: string | null;
    datetime?: string | null;
  } | null;
  error?: string;
  meta?: { fetchedAt?: string | null; studentNumber?: string };
};

const PLACEHOLDER = '—';
const CONDUCT_DATA_ENDPOINT = '/api/parent/conduct';
const GENERATE_CONDUCT_PDF_ENDPOINT = '/api/parent/generate-conduct-pdf';
const STUDENTS_PARTNERSHIP_CHARTER_ENDPOINT = '/api/parent/students-partnership-charter';

type PdfRequestBody = PdfFormData & { template?: 'uae' | 'expats' };

type GeneratePdfResult = {
  base64: string;
  filename: string;
};

function findSchoolOrg(value: unknown, seen = new WeakSet<object>()): Org | null {
  if (value === null || value === undefined) {
    return null;
  }

  const direct = extractOrgFromAny(value);
  if (direct) {
    return direct;
  }

  if (typeof value !== 'object') {
    return null;
  }

  const objectRef = value as object;
  if (seen.has(objectRef)) {
    return null;
  }
  seen.add(objectRef);

  const record = value as Record<string, unknown>;
  for (const nested of Object.values(record)) {
    const resolved = findSchoolOrg(nested, seen);
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

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

type PartnershipCharterPayload = {
  academicyear: string;
  studentNumber: string;
  attachment01: string;
  datetime: string;
};

async function submitPartnershipCharter(body: PartnershipCharterPayload): Promise<void> {
  const response = await fetch(STUDENTS_PARTNERSHIP_CHARTER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    const message = json && typeof json.error === 'string' ? json.error : 'Failed to submit partnership charter';
    throw new Error(message);
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
  const toast = useToastNotifications();
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
    mutate: mutateAggregated,
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

  const studentInfo = aggregated?.studentInfo ?? null;
  const schoolInfoRaw = aggregated?.schoolInfo ?? null;

  const schoolOrg = React.useMemo<Org | null>(() => findSchoolOrg(schoolInfoRaw), [schoolInfoRaw]);

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
  const studentNumber = student?.studentNumber?.trim() ?? null;

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

  const academicYearValue = React.useMemo(() => {
    const rawYear = latestEnrollment?.schoolYear?.trim();
    if (!rawYear) {
      return '2025-2026';
    }
    if (rawYear.includes('-')) {
      return rawYear;
    }
    const parsed = Number.parseInt(rawYear, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return `${parsed - 1}-${parsed}`;
    }
    return rawYear;
  }, [latestEnrollment?.schoolYear]);

  const charterStatusKey = studentNumber
    ? `${STUDENTS_PARTNERSHIP_CHARTER_ENDPOINT}?studentNumber=${encodeURIComponent(studentNumber)}&academicyear=${encodeURIComponent(academicYearValue)}`
    : null;

  const {
    data: charterStatusResponse,
    error: charterStatusError,
    isLoading: isCharterLoading,
    mutate: mutateCharter,
  } = useSWR<CharterStatusResponse>(charterStatusKey, jsonFetcher);

  const charterRecord = charterStatusResponse?.data ?? null;

  React.useEffect(() => {
    setIsSigned(false);
    setLatestPdfBase64(null);
  }, [studentNumber]);

  const charterErrorMessage =
    charterStatusResponse && charterStatusResponse.ok === false
      ? charterStatusResponse.error
      : charterStatusError instanceof Error
        ? charterStatusError.message
        : charterStatusError
          ? String(charterStatusError)
          : undefined;

  const hasFetchError = Boolean(apiErrorMessage);
  const combinedErrorMessage = apiErrorMessage ?? charterErrorMessage;
  const isInitialCharterLoading =
    Boolean(studentNumber) && isCharterLoading && !charterStatusResponse && !charterErrorMessage;
  
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
    if (!schoolOrg) return latestEnrollment?.schoolId || PLACEHOLDER;
    const resolvedLocale = locale === 'ar' ? 'ar' : 'en';
    const resolved = resolveSchoolName(schoolOrg, resolvedLocale).trim();
    return resolved.length > 0 ? resolved : latestEnrollment?.schoolId || PLACEHOLDER;
  }, [locale, schoolOrg, latestEnrollment]);

  const schoolYearLabel = latestEnrollment?.schoolYear || PLACEHOLDER;
  
  const schoolAddress = React.useMemo(() => {
    if (!schoolOrg) return PLACEHOLDER;
    const formatted = formatOrgAddress(schoolOrg).trim();
    return formatted.length > 0 ? formatted : PLACEHOLDER;
  }, [schoolOrg]);
  
  const schoolContact = React.useMemo(() => {
    if (!schoolOrg) {
      return { phone: undefined, email: undefined };
    }
    const contact = extractSchoolContact(schoolOrg);
    const phone = contact.phone?.trim();
    const email = contact.email?.trim();
    return {
      phone: phone && phone.length > 0 ? phone : undefined,
      email: email && email.length > 0 ? email : undefined,
    };
  }, [schoolOrg]);
  
  const latestStreamGradeName = latestEnrollment?.streamGradeId || PLACEHOLDER;

  const warningMessage = null;

  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString('en-US');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, []);

  React.useEffect(() => {
    if (!charterStatusResponse) return;
    const attachment = typeof charterRecord?.attachment01 === 'string' ? charterRecord.attachment01.trim() : '';
    if (attachment.length > 20) {
      setIsSigned(true);
      setLatestPdfBase64(attachment);
    } else if (charterStatusResponse.ok && (!charterRecord || attachment.length === 0)) {
      setIsSigned(false);
      setLatestPdfBase64(null);
    }
  }, [charterRecord, charterStatusResponse]);

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
      toast.error(
        locale === 'ar' ? 'خطأ' : 'Error',
        locale === 'ar'
          ? 'فشل إنشاء ملف PDF. يرجى المحاولة مرة أخرى.'
          : 'Failed to generate PDF. Please try again.'
      );
    }
  }, [handleGeneratePDF, latestPdfBase64, studentFullName, toast, locale]);

  const handleSign = React.useCallback(async () => {
    if (!isAgreed || isSigning) return;

    if (!studentNumber) {
      toast.error(
        locale === 'ar' ? 'خطأ' : 'Error',
        locale === 'ar' ? 'رقم الطالب غير متوفر.' : 'Student number is unavailable.'
      );
      return;
    }

    const academicyear = academicYearValue || '2025-2026';

    setIsSigning(true);
    try {
      const { base64 } = await handleGeneratePDF({ autoDownload: true });

      await submitPartnershipCharter({
        academicyear,
        studentNumber,
        attachment01: base64,
        datetime: new Date().toISOString(),
      });

      setLatestPdfBase64(base64);
      setIsSigned(true);

      const notifyParent = async (pdf: string) => {
        const emailRecipient = parentContacts.email?.trim();
        const smsRecipient = parentContacts.phone?.trim();

        const sendEmail = async () => {
          if (!emailRecipient) return;

          const response = await fetch('/api/notifications/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              pdf64: pdf,
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

      await notifyParent(base64);

      // Update conduct status in PP system
      if (resolvedStudentId) {
        try {
          const conductStatusResponse = await fetch(`/api/PP/conduct-status/${encodeURIComponent(resolvedStudentId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              status: 1,
              isConductAgreementSigned: true,
            }),
          });

          if (!conductStatusResponse.ok) {
            const errorData = await conductStatusResponse.json().catch(() => null);
            console.error('Failed to update conduct status in PP:', errorData);
            toast.warning(
              locale === 'ar' ? 'تحذير' : 'Warning',
              locale === 'ar' 
                ? 'تم حفظ الميثاق محليًا، لكن فشل التحديث في النظام المركزي'
                : 'Charter saved locally, but failed to update in central system'
            );
          } else {
            toast.success(
              locale === 'ar' ? 'تم بنجاح' : 'Success',
              locale === 'ar'
                ? 'تم توقيع الميثاق وحفظه بنجاح في جميع الأنظمة'
                : 'Charter signed and saved successfully across all systems'
            );
          }
        } catch (error) {
          console.error('Error updating conduct status in PP:', error);
          toast.warning(
            locale === 'ar' ? 'تحذير' : 'Warning',
            locale === 'ar'
              ? 'تم حفظ الميثاق محليًا، لكن حدث خطأ في الاتصال بالنظام المركزي'
              : 'Charter saved locally, but error connecting to central system'
          );
        }
      } else {
        // No PP integration, just show local success
        toast.success(
          locale === 'ar' ? 'تم بنجاح' : 'Success',
          locale === 'ar'
            ? 'تم توقيع الميثاق وحفظه بنجاح'
            : 'Charter signed and saved successfully'
        );
      }

      if (studentNumber) {
        await mutateCharter();
      }

      if (typeof mutateAggregated === 'function') {
        void mutateAggregated();
      }
    } catch (error) {
      console.error('Error completing conduct signature:', error);
      toast.error(
        locale === 'ar' ? 'خطأ' : 'Error',
        locale === 'ar'
          ? 'تعذر حفظ توقيع الميثاق. يرجى المحاولة مرة أخرى.'
          : 'Failed to submit the partnership charter. Please try again.',
      );
    } finally {
      setIsSigning(false);
    }
  }, [
    academicYearValue,
    handleGeneratePDF,
    isAgreed,
    isSigning,
    locale,
    mutateAggregated,
    mutateCharter,
    parentContacts.email,
    parentContacts.phone,
    resolvedStudentId,
    studentNumber,
  ]);

  if (!resolvedStudentId) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {t.parentConduct.noStudentId}
      </div>
    );
  }

  if (isLoading || isInitialCharterLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner variant="education" text={t.parentConduct.loading} />
      </div>
    );
  }

  if (hasFetchError) {
    const message = combinedErrorMessage ?? t.parentConduct.errorLoading;
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

  // If charter is already signed, show only the success message
  if (isSigned && latestPdfBase64) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        {/* Top nav */}
        <div className="mb-6">
          <Link 
            href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t.parentConduct.backButton}
          </Link>
        </div>

        {/* Header */}
        <Card className="mb-6 border shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
            <CardTitle className="text-center text-lg sm:text-xl font-semibold">
              {t.parentConduct.title}
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Already Signed Notice */}
        <Card className="border-2 border-green-500 shadow-lg">
          <CardContent className="pt-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">
                    {locale === 'ar' ? 'تم توقيع الميثاق بنجاح' : 'Charter Already Signed'}
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-400 mb-4">
                    {locale === 'ar' 
                      ? 'لقد قمت بالفعل بتوقيع ميثاق الشراكة بين المدرسة وولي الأمر. يمكنك تحميل نسخة من الميثاق الموقع في أي وقت.'
                      : 'You have already signed the partnership charter between the school and parent. You can download a copy of the signed charter at any time.'}
                  </p>

                  {/* Student Info Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-green-200 dark:border-green-800">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'الطالب: ' : 'Student: '}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{studentFullName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'ولي الأمر: ' : 'Parent: '}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{parentFullName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'المدرسة: ' : 'School: '}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{schoolName}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">
                          {locale === 'ar' ? 'السنة الدراسية: ' : 'Academic Year: '}
                        </span>
                        <span className="text-gray-900 dark:text-gray-100">{schoolYearLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Download Button */}
                  <button
                    type="button"
                    onClick={handleManualDownload}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {locale === 'ar' ? 'تحميل الميثاق الموقع' : 'Download Signed Charter'}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Link href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}>
            <button className="px-6 py-2 border rounded bg-muted hover:bg-muted/80 text-foreground transition-colors" type="button">
              {t.parentConduct.navigation.close}
            </button>
          </Link>
        </div>
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

              {/* Already Signed Notice */}
              {isSigned && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                        {locale === 'ar' ? '✓ تم توقيع الميثاق بنجاح' : '✓ Charter Already Signed'}
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        {locale === 'ar' 
                          ? 'لقد قمت بالفعل بتوقيع ميثاق الشراكة بين المدرسة وولي الأمر. يمكنك تحميل نسخة من الميثاق الموقع باستخدام الزر أدناه.'
                          : 'You have already signed the partnership charter between the school and parent. You can download a copy of the signed charter using the button below.'}
                      </p>
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleManualDownload}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {locale === 'ar' ? 'تحميل الميثاق الموقع' : 'Download Signed Charter'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {!isSigned && (
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
                        disabled={isSigning}
                      />
                      <label htmlFor="agree-checkbox" className="text-sm text-foreground cursor-pointer">
                        {locale === 'ar' 
                          ? 'أوافق على جميع بنود وشروط ميثاق الشراكة بين المدرسة وولي الأمر وأتعهد بالالتزام بها.'
                          : 'I agree to all terms and conditions of the partnership charter between the school and parent and commit to abide by them.'}
                      </label>
                    </div>

                    {charterErrorMessage && (
                      <div className="mt-3 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2">
                        {locale === 'ar'
                          ? 'تعذر التحقق من حالة الميثاق الحالية. يمكنك متابعة التوقيع، وسيتم التحقق مرة أخرى بعد الحفظ.'
                          : 'Unable to verify the existing charter status. You may continue signing and the system will re-check after saving.'}
                      </div>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={handleSign}
                        disabled={!isAgreed || isSigning || !studentNumber || isCharterLoading}
                        className={`w-full sm:w-auto px-6 py-3 rounded-lg font-medium transition-all ${
                          !isAgreed || isSigning || !studentNumber || isCharterLoading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg'
                        }`}
                      >
                        {isSigning
                          ? locale === 'ar'
                            ? 'جاري التوقيع...'
                            : 'Signing...'
                          : locale === 'ar'
                            ? 'توقيع الميثاق'
                            : 'Sign Charter'}
                      </button>
                      
                      {!isAgreed && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {locale === 'ar' 
                            ? 'يرجى الموافقة على الشروط للمتابعة'
                            : 'Please agree to the terms to proceed'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

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
