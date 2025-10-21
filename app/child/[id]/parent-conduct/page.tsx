'use client';

import React from 'react';
import useSWR from 'swr';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import { jsonFetcher } from '@/lib/swr';
import type {
  Person,
  PersonAddress,
  PersonContact,
  Org,
  SchoolEnrollment,
  StreamGrade,
} from '@/types';

interface BasicInfoResponse {
  meta: {
    eid?: string;
    parentEid?: string;
    personSourcedId?: string;
    role?: string;
    studentCount?: number;
    cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null };
  };
  parent: Person[];
  children: Person[];
  warning?: string;
  error?: string;
}

interface SchoolEnrollmentResponse {
  enrollments: SchoolEnrollment[];
  count: number;
  studentId: string;
  schoolYear: string;
  schoolID?: string | null;
  schoolInfo?: unknown;
  schoolInfos?: unknown;
  StreamGrades?: Array<StreamGrade | null>;
  meta?: { cache?: { source?: 'cache' | 'upstream'; lastUpdated?: string | null } };
}

const PLACEHOLDER = '—';

function pickPrimaryPerson(response?: BasicInfoResponse | null): Person | undefined {
  return response?.parent?.[0] ?? response?.children?.[0];
}

function preferValue(...values: Array<string | undefined | null>): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

function formatPersonName(person?: Person | null): string {
  if (!person) return '';
  const arabic = [person.givenName, person.middleName, person.familyName]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();
  if (arabic.length > 0) return arabic;

  const english = [
    person.metadata?.englishFirstName,
    person.metadata?.englishSecondName,
    person.metadata?.englishThirdName,
    person.metadata?.englishFamilyName,
  ]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(' ')
    .trim();

  if (english.length > 0) return english;
  return person.username ?? person.sourcedId ?? '';
}

function formatPersonAddress(addresses?: PersonAddress[]): string {
  if (!addresses?.length) return '';
  const address = addresses[0];
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
  return parts;
}

function formatOrgAddress(org?: Org | null): string {
  const address = org?.metadata?.addresses?.[0];
  if (!address) return '';
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .filter((part) => typeof part === 'string' && part.trim().length > 0)
    .join(', ');
  return parts;
}

function findContactValue(
  contacts: PersonContact[] | undefined,
  keywords: string[],
  valuePredicate?: (value: string) => boolean,
): string | undefined {
  if (!contacts?.length) return undefined;
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());

  const scan = (requireKeyword: boolean) => {
    for (const contact of contacts) {
      if (!contact) continue;
      const type = contact.contactType?.toLowerCase?.() ?? '';
      const matchesKeyword = loweredKeywords.some((keyword) => keyword && type.includes(keyword));
      if (requireKeyword && !matchesKeyword) {
        continue;
      }

      const candidates = new Set<string>();
      if (typeof contact.value === 'string') candidates.add(contact.value);
      if (typeof contact.note === 'string') candidates.add(contact.note);
      for (const entry of Object.values(contact)) {
        if (typeof entry === 'string') candidates.add(entry);
      }

      for (const candidate of candidates) {
        const trimmed = candidate.trim();
        if (!trimmed) continue;
        const predicatePassed = valuePredicate ? valuePredicate(trimmed) : true;
        if (predicatePassed) {
          return trimmed;
        }
      }
    }
    return undefined;
  };

  return scan(true) ?? scan(false);
}

function extractPersonContact(person?: Person | null): { phone?: string; email?: string } {
  if (!person) return {};
  const contacts = person.metadata?.contacts;
  const email = preferValue(
    person.email,
    findContactValue(contacts, ['email'], (value) => value.includes('@')),
  );
  const phone = preferValue(
    person.phone,
    person.sms,
    findContactValue(contacts, ['mobile', 'phone', 'tel'], (value) =>
      /\d{3}/.test(value.replace(/\D/g, '')),
    ),
  );
  return { phone, email };
}

function isOrg(candidate: unknown): candidate is Org {
  if (!candidate || typeof candidate !== 'object') return false;
  const record = candidate as Record<string, unknown>;
  return (
    typeof record.sourcedId === 'string' ||
    typeof record.name === 'string' ||
    (record.metadata && typeof record.metadata === 'object')
  );
}

function extractOrgFromAny(input: unknown): Org | null {
  if (!input) return null;
  if (isOrg(input)) return input as Org;
  if (typeof input === 'object') {
    const record = input as Record<string, unknown>;
    if (record.Org) return extractOrgFromAny(record.Org);
    if (record.org) return extractOrgFromAny(record.org);
  }
  return null;
}

function collectOrgs(...sources: unknown[]): Org[] {
  const visited = new Set<string>();
  const results: Org[] = [];

  const visit = (value: unknown) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const org = extractOrgFromAny(value);
    if (org) {
      const key = org.sourcedId ?? JSON.stringify(org);
      if (!visited.has(key)) {
        visited.add(key);
        results.push(org);
      }
    }
  };

  sources.forEach(visit);
  return results;
}

function extractSchoolContact(org?: Org | null): { phone?: string; email?: string } {
  const contacts = org?.metadata?.contacts;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return {};
  }

  let phone: string | undefined;
  let email: string | undefined;

  for (const rawContact of contacts) {
    if (!rawContact || typeof rawContact !== 'object') continue;
    const contact = rawContact as Record<string, unknown>;
    const type = String(contact.contactType ?? contact.type ?? '').toLowerCase();

    const values = Object.values(contact)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim());

    if (!email) {
      const candidate =
        values.find((value) => value.includes('@')) ||
        (type.includes('email') ? values[0] : undefined);
      if (candidate) email = candidate;
    }

    if (!phone) {
      const candidate =
        values.find((value) => /\d{3}/.test(value.replace(/\D/g, ''))) ||
        (type.includes('phone') || type.includes('mobile') || type.includes('tel') ? values[0] : undefined);
      if (candidate) phone = candidate;
    }

    if (phone && email) break;
  }

  return { phone, email };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseDate(value: unknown): number {
  if (typeof value !== 'string' || value.trim().length === 0) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function findLatestEnrollment(enrollments?: SchoolEnrollment[]): SchoolEnrollment | undefined {
  if (!enrollments?.length) return undefined;
  return enrollments.reduce<SchoolEnrollment | undefined>((latest, current) => {
    if (!latest) return current;
    const currentYear = toNumber(current.schoolYear);
    const latestYear = toNumber(latest.schoolYear);
    if (currentYear !== latestYear) {
      return currentYear > latestYear ? current : latest;
    }
    const currentDate = parseDate(current.dateLastModified ?? current.entryDate);
    const latestDate = parseDate(latest.dateLastModified ?? latest.entryDate);
    return currentDate >= latestDate ? current : latest;
  }, undefined);
}

function extractStreamGradeName(
  streamGrades: Array<StreamGrade | null> | undefined,
  streamId?: string,
): string {
  if (!streamId || !streamGrades?.length) return '';
  const match = streamGrades
    .filter((item): item is StreamGrade => Boolean(item))
    .find((item) => item.streamGrade?.sourcedId === streamId);
  if (!match) return '';
  const sg = match.streamGrade;
  return (
    preferValue(
      sg?.metadata?.titleArabic,
      sg?.title,
      sg?.name,
    ) ?? ''
  );
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
  const params = useParams();
  const searchParams = useSearchParams();
  const routeChildId = params?.id as string | undefined;
  const queryStudentId = searchParams.get('studentId') || undefined;
  const resolvedStudentId = queryStudentId || routeChildId || '';

  const [currentStep, setCurrentStep] = React.useState(1);

  const studentKey = resolvedStudentId
    ? `/api/oneroster/basic-info-full?sourcedId=${encodeURIComponent(resolvedStudentId)}`
    : null;
  const {
    data: studentInfo,
    error: studentError,
    isLoading: studentLoading,
  } = useSWR<BasicInfoResponse>(studentKey, jsonFetcher);

  const {
    data: parentInfo,
    error: parentError,
    isLoading: parentLoading,
  } = useSWR<BasicInfoResponse>('/api/oneroster/basic-info-full', jsonFetcher);

  const enrollmentKey = resolvedStudentId
    ? `/api/oneroster/schoolenrollments?studentId=${encodeURIComponent(resolvedStudentId)}`
    : null;
  const {
    data: enrollmentInfo,
    error: enrollmentError,
    isLoading: enrollmentLoading,
  } = useSWR<SchoolEnrollmentResponse>(enrollmentKey, jsonFetcher);

  const isLoading = (resolvedStudentId ? studentLoading || enrollmentLoading : false) || parentLoading;
  const fetchError = studentError || enrollmentError || parentError;

  const studentPerson = React.useMemo(() => pickPrimaryPerson(studentInfo), [studentInfo]);
  const parentPerson = React.useMemo(() => pickPrimaryPerson(parentInfo), [parentInfo]);

  const latestEnrollment = React.useMemo(
    () => findLatestEnrollment(enrollmentInfo?.enrollments),
    [enrollmentInfo],
  );

  const allSchools = React.useMemo(
    () => collectOrgs(enrollmentInfo?.schoolInfo, enrollmentInfo?.schoolInfos),
    [enrollmentInfo],
  );

  const latestSchool = React.useMemo(() => {
    if (!latestEnrollment) {
      return allSchools[0];
    }
    const schoolId = latestEnrollment.school?.sourcedId;
    if (!schoolId) {
      return allSchools[0];
    }
    return allSchools.find((org) => org.sourcedId === schoolId) ?? allSchools[0];
  }, [allSchools, latestEnrollment]);

  const schoolContact = React.useMemo(() => extractSchoolContact(latestSchool), [latestSchool]);

  const latestStreamGradeName = React.useMemo(
    () =>
      extractStreamGradeName(
        enrollmentInfo?.StreamGrades,
        latestEnrollment?.streamGrade?.sourcedId,
      ),
    [enrollmentInfo, latestEnrollment],
  );

  const studentFullName = formatPersonName(studentPerson) || PLACEHOLDER;
  const parentFullName = formatPersonName(parentPerson) || PLACEHOLDER;

  const studentAddress = formatPersonAddress(studentPerson?.metadata?.addresses) || PLACEHOLDER;
  const parentAddress = formatPersonAddress(parentPerson?.metadata?.addresses) || PLACEHOLDER;

  const studentContacts = extractPersonContact(studentPerson);
  const parentContacts = extractPersonContact(parentPerson);

  const parentEid =
    preferValue(
      parentInfo?.meta?.eid,
      parentInfo?.meta?.parentEid,
      parentPerson?.identifier,
      parentPerson?.metadata?.identifier as string | undefined,
    ) ?? PLACEHOLDER;

  const studentNationalId =
    preferValue(
      studentPerson?.identifier,
      studentPerson?.metadata?.identifier as string | undefined,
    ) ?? PLACEHOLDER;

  const schoolName =
    preferValue(
      latestSchool?.name,
      latestSchool?.metadata?.englishName,
      latestSchool?.metadata?.shortName,
    ) ?? PLACEHOLDER;

  const schoolAddress = formatOrgAddress(latestSchool) || PLACEHOLDER;

  const schoolYearLabel = latestEnrollment?.schoolYear
    ? String(latestEnrollment.schoolYear)
    : PLACEHOLDER;

  const today = React.useMemo(() => {
    try {
      return new Date().toLocaleDateString('ar-SA');
    } catch {
      return new Date().toLocaleDateString();
    }
  }, []);

  if (!resolvedStudentId) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        لا يمكن عرض الصفحة بدون معرف الطالب.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner variant="education" text="جاري تحميل بيانات الميثاق..." />
      </div>
    );
  }

  if (fetchError) {
    const message =
      fetchError instanceof Error
        ? fetchError.message
        : 'تعذر تحميل البيانات المطلوبة.';
    return (
      <div className="max-w-xl mx-auto py-10 text-center text-destructive">
        {message}
      </div>
    );
  }

  const warningMessage =
    (studentInfo as { warning?: string } | undefined)?.warning ||
    (parentInfo as { warning?: string } | undefined)?.warning;

  if (warningMessage) {
    return (
      <div className="max-w-xl mx-auto py-10 text-center">
        <div className="text-destructive bg-destructive/10 border border-destructive/20 rounded p-4">
          {warningMessage}
        </div>
      </div>
    );
  }

  const conductTerms = {
    validityPeriod: 'سنة دراسية واحدة تبدأ من تاريخ الإقرار على الميثاق.',
    schoolCommitments: {
      title: 'التزامات المدرسة',
      sections: [
        {
          title: 'المتطلبات الأساسية',
          items: [
            'ضمان بيئة مدرسية قائمة على المساواة وتكافؤ الفرص بين الطلبة كافة.',
            'اطلاع أولياء الأمور على نتائج التقييمات والإجراءات المعتمدة لرفع مستوى أداء أبنائهم.',
            'إبلاغ أولياء الأمور عن سلوكيات أبنائهم الإيجابية، بالإضافة إلى مخالفاتهم السلوكية.',
            'تعريف أولياء أمور الطلبة من فئة أصحاب الهمم بحقوقهم وواجباتهم وتوفير بيئة تعليمية غنية وداعمة ومرافق مجهزة ومعدلة تلائم احتياجاتهم.',
            'ضمان توفير بيئة مدرسية آمنة وشاملة تضمن سلامة الطلبة.',
            'وضع الإرشادات الخاصة بصحة الطلبة وتوعيتهم بأهمية تبني عادات وأنماط الحياة الصحية.',
            'بناء قنوات تواصل فعالة مع أولياء الأمور لإبلاغهم بالمستجدات من التعليمات أو الإجراءات أو اللوائح ومشاركتهم بالمعلومات المهمة بالإضافة إلى اطلاعهم على أخبار المدرسة.',
            'الشفافية والعدالة في تنفيذ الإجراءات والسياسات مع الحفاظ على سرية المعلومات وبيانات الطلبة.'
          ]
        },
        {
          title: 'السلوك والانضباط',
          items: [
            'تطبيق القرار الوزاري رقم (851) لسنة 2018 بشأن لائحة إدارة سلوك الطلبة في مؤسسات التعليم العام الطلبة بعدالة وشفافية، مع توعية الطلبة وأولياء أمورهم بالعواقب المترتبة على المخالفات.',
            'متابعة انتظام الطلبة في الحضور والانصراف وفق المواعيد الرسمية والأدلة الإجرائية، واتخاذ الإجراءات المناسبة عند وجود تأخير أو غياب غير مبرر.',
            'الالتزام باحترام أولياء الأمور، وبناء قنوات تواصل فعّالة معهم لإبلاغهم بالمستجدات المتعلقة بالتعليمات والإجراءات واللوائح، ومشاركتهم بالمعلومات المهمة، وإطلاعهم على أخبار المدرسة بانتظام.'
          ]
        },
        {
          title: 'جودة حياة الطلبة / الصحة والسلامة',
          items: [
            'توفير بيئة مدرسية صحية وآمنة تتوافق مع معايير الامن والسلامة.',
            'تنظيم برامج توعية لتعزيز النظافة الشخصية والصحة العامة للطلبة.',
            'حفظ السجلات الطبية الخاصة بالطلبة والتنسيق مع أولياء الأمور بشأن أي حالات صحية.'
          ]
        },
        {
          title: 'المواطنة الإيجابية والهوية الوطنية',
          items: [
            'تنظيم فعاليات لتعزيز قيم المواطنة الصالحة والمسؤولية الاجتماعية لدى الطلبة.',
            'غرس الاعتزاز بالهوية الوطنية والقيم الإنسانية مثل الاحترام والتسامح والتعايش المشترك من خلال الأنشطة المختلفة.'
          ]
        },
        {
          title: 'التحصيل الدراسي والمناهج والبرامج التعليمية',
          items: [
            'تحديث بيانات الطلبة بشكل دوري في أنظمة الوزارة.',
            'متابعة الأداء الأكاديمي للطلبة بانتظام، وإشراك أولياء الأمور في نتائج التقييمات والإجراءات المعتمدة لرفع مستوى أبنائهم.',
            'إعداد وتنفيذ خطط تربوية فردية للطلبة من أصحاب الهمم بالتعاون مع أسرهم.',
            'الشفافية والعدالة في تنفيذ الإجراءات والسياسات مع الحفاظ على سرية المعلومات وبيانات الطلبة.'
          ]
        },
        {
          title: 'التقييم والامتحانات',
          items: [
            'تطبيق سياسة التقييم المعتمدة والالتزام بالمواعيد الرسمية للتقييمات والامتحانات.',
            'متابعة نتائج الطلبة بشكل مستمر وتقديم التغذية الراجعة.',
            'ضمان جاهزية بيئة الامتحانات وتوفير الأدوات والأجهزة اللازمة.',
            'منع أي ممارسات تتعلق بالغش أو تسريب الأسئلة، واتخاذ الإجراءات الرادعة عند وقوعها.'
          ]
        },
        {
          title: 'الأنشطة والرعاية الطلابية',
          items: [
            'توفير أنشطة صفية ولاصفية متنوعة لاكتشاف وتنمية مهارات الطلبة.',
            'تشجيع الطلبة على المشاركة في المبادرات الوطنية والبرامج التطوعية وخدمة المجتمع.'
          ]
        },
        {
          title: 'المواصلات',
          items: [
            'الإشراف على خدمات النقل المدرسي الخاصة بالمدرسة وضمان الالتزام بمعايير السلامة.',
            'متابعة سلوك الطلبة في الحافلات واتخاذ الإجراءات التربوية عند حدوث مخالفات.'
          ]
        },
        {
          title: 'الزي المدرسي',
          items: [
            'توعية أولياء الأمور بدليل الزي المدرسي وقنوات البيع الرسمية للزي المدرسي الموحد.',
            'متابعة التزام الطلبة بالزي والمظهر اللائق أثناء الدوام المدرسي.'
          ]
        },
        {
          title: 'الممتلكات العامة بالمدرسة',
          items: [
            'تعزيز وعي الطلبة بأهمية المحافظة على الممتلكات العامة والمرافق المدرسية.',
            'مراقبة استخدام الطلبة للمرافق وضمان حمايتها من العبث أو التخريب.',
            'تطبيق الإجراءات المناسبة في حال حدوث أضرار، بالتنسيق مع أولياء الأمور.'
          ]
        }
      ]
    },
    parentCommitments: {
      title: 'التزامات ولي الأمر',
      sections: [
        {
          title: 'السلوك',
          items: [
            'تشجيع أبنائهم على تبني القيم الأخلاقية والتربوية وتعزيز السُّلوك الايجابي لديهم وتحفيزهم على التعلم والالتزام بالقوانين واحترام جميع العاملين في المدرسة.',
            'الاطلاع على لائحة إدارة سلوك الطلبة في مؤسسات التعليم الحكومية الاتحادية المعتمدة، وتوعية وارشاد أبنائهم على ضرورة الالتزام بها والعواقب التي تترتب على مخالفتها.',
            'حث الطلبة على الالتزام بمواعيد الحضور والانصراف والإلمام بالنتائج المترتبة على التأخير وعدم الغياب دون عذر مقبول بالحضور المبكر للمدرسة وفق المواعيد المحددة والإلمام بعواقب الغياب دون عذر مقبول والتي تتضمن رسوب السنة الدراسية وإعادة السنة كاملة.',
            'الالتزام بتعليمات المدرسة عند الحضور لطلب خدمة أو لمناقشة مشكلة أو تسوية أية نزاعات.'
          ]
        },
        {
          title: 'جودة حياة الطلبة / الصحة والسلامة',
          items: [
            'توفير بيئة صحية تشمل معايير الأغذية الصحية، وأصناف الطعام والشراب المسموح بها في المدرسة.',
            'توفير الوقت الكافي للنوم والاسترخاء والراحة النفسية لأبنائهم في بيئة عائلية مستقرة.',
            'التوعية حول النظافة الشخصية للأبناء.',
            'التحفيز على ممارسة الأنشطة البدنية من خلال التحرك واللعب.',
            'تقديم المساعدة والدعم للأبناء في حل المشاكل الشخصية والعاطفية والدراسية.',
            'توفير كافة التقارير الطبية المتعلقة بالطالب وسيرته المرضية لإدارة المدرسة.',
            'المشاركة الفعالة من خلال الإجابة على الاستبانات المرسلة من قبل الوزارة أو المدرسة.'
          ]
        },
        {
          title: 'المواطنة الإيجابية والهوية الوطنية',
          items: [
            'الالتزام بتعزيز المواطنة الصالحة والمسؤولية الاجتماعية لدى الأبناء وتحفيزهم على القيام بالواجبات والمسؤوليات الوطنية، وتشجيعهم على المشاركة الفعالة في الحياة الاجتماعية والأعمال الخيرية والتطوعية.',
            'الالتزام بتحفيز الأبناء على الاعتزاز بهويتهم الوطنية، والتحلّي بالأخلاق والقيم الإنسانية الأساسية كالاحترام والتسامح والتعايش المشترك بين المواطنين والمقيمين.'
          ]
        },
        {
          title: 'التحصيل الدراسي والمناهج والبرامج التعليمية',
          items: [
            'تحديث بيانات الأبناء حسب الإجراءات والشروط والأحكام المعتمدة في الوزارة.',
            'يلتزم ولي الأمر بتوفير جهاز الحاسب الي حسب الاجراءات المواصفات المعتمدة في الوزارة مع الالتزام بالمعايير والشروط الخاصة بسياسة استخدام الحاسوب.',
            'التواصل مع إدارة المدرسة لمتابعة أداء أبنائهم في الدراسة وتقديم الدعم لهم.',
            'تحفيز الأبناء على الدراسة، وتحديد الأهداف الواضحة لهم، وإرشادهم، وإظهار أهمية التعليم في حياتهم المستقبلية.',
            'تهيئة الجو الأسري وتخصيص الوقت الكافي للدراسة والتحضير والاستعداد للامتحانات مع ضمان الوقت الكافي للراحة.',
            'متابعة الطلبة من فئة أصحاب الهمم في أداء واجباتهم حسب الخطة التربوية الفردية المعتمدة.'
          ]
        },
        {
          title: 'التقييم والامتحانات',
          items: [
            'الاطلاع على سياسة التقييم المعتمدة والتقيد بما جاء فيها والالتزام بالمواعيد المحددة بالتقييم والامتحانات.',
            'متابعة التقييمات والامتحانات للأبناء بشكل مستمر لرفع مستوى أدائهم على مدار العام الدراسي.',
            'التأكد من جاهزية الأبناء لأداء الامتحان (إحضار الأدوات اللازمة، شحن جهاز الحاسب الآلي/اللوحي).',
            'توعية الطالب بالالتزام بقواعد ولوائح تأدية الامتحان وعدم الغش أو تسريب أسئلة الامتحانات أو المشاركة فيها بأي شكل من الأشكال.'
          ]
        },
        {
          title: 'الأنشطة والرعاية الطلابية',
          items: [
            'تشجيع الأبناء على المشاركة في الأنشطة الصفية واللّاصفية، والفعّاليات، والمبادرات الوطنيّة والعمل التطوعي والخدمة المجتمعية؛ لاكتساب وصقل المهارات العامة.'
          ]
        },
        {
          title: 'المواصلات',
          items: [
            'الالتزام باتباع جميع شروط السلامة والقواعد السلوكية ومواعيد النقل المدرسي التي اعتمدتها المدرسة.',
            'توجيه الأبناء إلى الالتزام بالسلوك الإيجابي في الحافلات المدرسية.',
            'الالتزام بتسديد قيمة أي تلفيات تسبب بها أبناؤه في الحافلة المدرسية.'
          ]
        },
        {
          title: 'الزي المدرسي',
          items: [
            'الالتزام بارتداء الأبناء الزّيَّ المدرسي الموحد من قبل الوزارة.',
            'التزام الأبناء بالمظهر اللائق والأنيق أثناء الدوام المدرسي.'
          ]
        },
        {
          title: 'الممتلكات العامة بالمدرسة',
          items: [
            'تعليم الأبناء قيمة المحافظة على الممتلكات العامة وأهميتها، وتحفيزهم على المحافظة عليها.',
            'توجيه الأبناء بعدم إلحاق أي أضرار متعمدة أو غير متعمدة بالممتلكات العامة في المدرسة.',
            'التعهد بالتعويض عن الأضرار الناجمة عن العبث بالممتلكات والمرافق التي قد يحدثها الطالب في المدرسة أو وسائل النقل.'
          ]
        }
      ]
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 direction-rtl" dir="rtl">
      {/* Top nav */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4 ml-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          الرجوع
        </Link>
        <div className="text-xs text-muted-foreground">
          <span>المرحلة: {currentStep} من 4</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">التقدم</span>
          <span className="text-sm text-muted-foreground">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span className={currentStep >= 1 ? 'text-primary font-medium' : ''}>معلومات المدرسة</span>
          <span className={currentStep >= 2 ? 'text-primary font-medium' : ''}>معلومات ولي الأمر</span>
          <span className={currentStep >= 3 ? 'text-primary font-medium' : ''}>أحكام الميثاق</span>
          <span className={currentStep >= 4 ? 'text-primary font-medium' : ''}>التوقيع</span>
        </div>
      </div>

      {/* Header */}
      <Card className="mb-8 border shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground">
          <CardTitle className="text-center text-lg sm:text-xl font-semibold">
            ميثاق الشراكة بين المدرسة وولي الأمر
          </CardTitle>
          <p className="text-center text-primary-foreground/80 mt-2 text-sm">
            وزارة التربية والتعليم - الإمارات العربية المتحدة
          </p>
        </CardHeader>
        <CardContent className="pt-6 text-foreground leading-6">
          <div className="bg-muted border-r-4 border-primary p-4 rounded-lg">
            <h3 className="font-medium text-foreground mb-3 flex items-center text-sm">
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              مقدمة
            </h3>
            <p className="mb-3 text-muted-foreground text-sm">
              في إطار تفعيل الشراكة الفاعلة بين المدرسة وولي الأمر وتعزيز دورهما في دعم التحصيل وسلوك أبنائنا الطلبة، يهدف هذا الميثاق إلى توضيح الأدوار
              والمسؤوليات المتبادلة بين الطرفين بما يضمن توفير بيئة تعليمية آمنة ومحفزة.
            </p>
            <p className="text-muted-foreground text-sm">
              ويعد توقيع ولي الأمر على هذا الميثاق إقرارًا بالاطلاع على بنوده وفهمها والالتزام بمقتضاها، كما يمثل اتفاقًا على التعاون البناء مع المدرسة
              لتحقيق مخرجات تعليمية وسلوكية متميزة لأبنائنا وبناتنا.
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
                الجزء الأول: معلومات المدرسة
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="اسم المدرسة" value={schoolName} />
                <InfoField
                  label="معرف المدرسة"
                  value={latestEnrollment?.school?.sourcedId || PLACEHOLDER}
                  mono
                />
                <InfoField label="العنوان" value={schoolAddress} span={2} />
                <InfoField label="رقم الهاتف" value={schoolContact.phone || PLACEHOLDER} />
                <InfoField label="البريد الإلكتروني" value={schoolContact.email || PLACEHOLDER} />
                <InfoField label="السنة الدراسية" value={schoolYearLabel} />
                <InfoField label="الصف الدراسي والشعبة" value={latestStreamGradeName || PLACEHOLDER} />
                <InfoField label="اسم الطالب/ـة" value={studentFullName} />
                <InfoField
                  label="الرقم الوطني / السجل المدني"
                  value={studentNationalId}
                  mono
                />
                <InfoField
                  label="معرف الطالب في النظام"
                  value={resolvedStudentId || PLACEHOLDER}
                  mono
                />
                <InfoField
                  label="معرف المسار (Route ID)"
                  value={routeChildId || PLACEHOLDER}
                  mono
                />
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
                الجزء الثاني: معلومات ولي الأمر
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary-foreground/80">بيانات ولي الأمر</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="اسم ولي الأمر" value={parentFullName} />
                    <InfoField label="رقم الهوية الوطنية" value={parentEid} mono />
                    <InfoField label="العنوان" value={parentAddress} span={2} />
                    <InfoField label="رقم التواصل" value={parentContacts.phone || PLACEHOLDER} />
                    <InfoField label="البريد الإلكتروني" value={parentContacts.email || PLACEHOLDER} />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h4 className="text-sm font-semibold text-primary-foreground/80">بيانات الطالب المرتبطة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField label="اسم الطالب/ـة الكامل" value={studentFullName} />
                    <InfoField label="الرقم الوطني / السجل المدني" value={studentNationalId} mono />
                    <InfoField label="العنوان" value={studentAddress} span={2} />
                    <InfoField label="رقم التواصل" value={studentContacts.phone || PLACEHOLDER} />
                    <InfoField label="البريد الإلكتروني" value={studentContacts.email || PLACEHOLDER} />
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
                  <h4 className="font-semibold text-foreground">مدة وصلاحية هذا الميثاق:</h4>
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
                {conductTerms.schoolCommitments.title}
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
                {conductTerms.parentCommitments.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/50">
                {conductTerms.parentCommitments.sections.map((section, sectionIndex) => (
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
                التوقيع والاعتماد
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Summary Information */}
              <div className="bg-muted border rounded-lg p-3 mb-4">
                <h4 className="font-medium text-foreground mb-2 text-sm">ملخص البيانات</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div><span className="font-medium">المدرسة:</span> {schoolName}</div>
                  <div><span className="font-medium">الطالب:</span> {studentFullName}</div>
                  <div><span className="font-medium">ولي الأمر:</span> {parentFullName}</div>
                  <div><span className="font-medium">الصف:</span> {latestStreamGradeName || PLACEHOLDER}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-accent/20 border border-accent rounded-lg">
                  <div className="h-5 w-5 border-border rounded mt-0.5 bg-accent/40 flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">إقرار ولي الأمر:</span><br />
                    أقر بأنني اطلعت على جميع بنود ميثاق الشراكة بين المدرسة وولي الأمر، وفهمت محتواها بالكامل، 
                    وأتعهد بالالتزام بجميع البنود والشروط المذكورة أعلاه، والتعاون مع المدرسة لضمان تحقيق المصلحة الفضلى لابني/ابنتي.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 mt-4">
                  <div className="md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-secondary rounded-lg py-6 bg-secondary/10">
                    <svg className="w-8 h-8 text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-secondary-foreground text-xs mb-1">ختم وزارة التربية والتعليم</div>
                    <div className="text-lg font-bold text-secondary-foreground">معتمد</div>
                  </div>
                  <div>
                    <div className="block text-xs font-medium text-foreground mb-2">التاريخ</div>
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
              السابق
            </button>
          )}
          <Link href={routeChildId ? `/child/${encodeURIComponent(routeChildId)}` : '/dashboard'}>
            <button className="px-4 py-2 border rounded bg-muted text-foreground" type="button">إغلاق</button>
          </Link>
        </div>
        <div className="flex gap-3">
          {currentStep < 4 && (
            <button 
              type="button" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded"
              onClick={handleNext}
            >
              التالي
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
