import type {
  Org,
  Person,
  PersonAddress,
  PersonContact,
  SchoolEnrollment,
  StreamGrade,
} from "@/types";

export interface BasicInfoResponse {
  meta: {
    eid?: string;
    parentEid?: string;
    personSourcedId?: string;
    role?: string;
    studentCount?: number;
    cache?: { source?: "cache" | "upstream"; lastUpdated?: string | null };
  };
  parent: Person[];
  children: Person[];
  warning?: string;
  error?: string;
}

export interface SchoolEnrollmentResponse {
  enrollments: SchoolEnrollment[];
  count: number;
  studentId: string;
  schoolYear: string;
  schoolID?: string | null;
  schoolInfo?: unknown;
  schoolInfos?: unknown;
  StreamGrades?: Array<StreamGrade | null>;
  meta?: { cache?: { source?: "cache" | "upstream"; lastUpdated?: string | null } };
}

export type UpdateInfoRow = {
  isConductAgreementSigned?: boolean | null;
  conductAgreementStatus?: number | null;
  pdfBase64?: string | null;
};

export type ParentConductAggregatedResponse = {
  studentInfo: BasicInfoResponse | null;
  parentInfo: BasicInfoResponse | null;
  enrollmentInfo: SchoolEnrollmentResponse | null;
  updateInfo: { ok: boolean; data?: UpdateInfoRow } | null;
};

export function pickPrimaryPerson(response?: BasicInfoResponse | null): Person | undefined {
  return response?.parent?.[0] ?? response?.children?.[0];
}

export function preferValue<T extends string | undefined | null>(
  ...values: Array<T>
): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
}

const citizenshipStatusCache = new Map<string, string | null>();

function extractCitizenshipStatusFromStudentPayload(payload: unknown, seen = new WeakSet<object>()): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  if (seen.has(payload as object)) {
    return undefined;
  }
  seen.add(payload as object);

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const result = extractCitizenshipStatusFromStudentPayload(item, seen);
      if (result) return result;
    }
    return undefined;
  }

  const record = payload as Record<string, unknown>;

  const directKeys = [
    "citizenshipStatus",
    "citizenship",
    "nationalityStatus",
    "nationality",
  ];

  for (const key of directKeys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  const nestedKeys = [
    "metadata",
    "student",
    "Student",
    "person",
    "Person",
    "data",
    "payload",
    "result",
  ];

  for (const key of nestedKeys) {
    const value = record[key];
    if (typeof value === "object" && value !== null) {
      const nested = extractCitizenshipStatusFromStudentPayload(value, seen);
      if (nested) return nested;
    }
  }

  for (const value of Object.values(record)) {
    if (typeof value === "object" && value !== null) {
      const nested = extractCitizenshipStatusFromStudentPayload(value, seen);
      if (nested) return nested;
    }
  }

  return undefined;
}

export function formatPersonName(person?: Person | null, locale: "ar" | "en" = "ar"): string {
  if (!person) return "";

  if (locale === "en") {
    const english = [
      person.metadata?.englishFirstName,
      person.metadata?.englishSecondName,
      person.metadata?.englishThirdName,
      person.metadata?.englishFamilyName,
    ]
      .filter((part) => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim();
    if (english.length > 0) return english;
  }

  const arabic = [person.givenName, person.middleName, person.familyName]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  if (arabic.length > 0) return arabic;

  const englishFallback = [
    person.metadata?.englishFirstName,
    person.metadata?.englishSecondName,
    person.metadata?.englishThirdName,
    person.metadata?.englishFamilyName,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();

  if (englishFallback.length > 0) return englishFallback;
  return person.username ?? person.sourcedId ?? "";
}

export function formatPersonAddress(addresses?: PersonAddress[]): string {
  if (!addresses?.length) return "";
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
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(", ");
  return parts;
}

export function formatOrgAddress(org?: Org | null): string {
  const address = org?.metadata?.addresses?.[0];
  if (!address) return "";
  const parts = [
    address.addressLine1,
    address.addressLine2,
    address.addressLine3,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(", ");
  return parts;
}

export async function extractCitizenship(person?: Person | null): Promise<string | undefined> {
  if (!person) return undefined;

  const sourcedId = typeof person.sourcedId === "string" && person.sourcedId.trim().length > 0
    ? person.sourcedId.trim()
    : undefined;
  if (!sourcedId) {
    return undefined;
  }

  if (citizenshipStatusCache.has(sourcedId)) {
    const cached = citizenshipStatusCache.get(sourcedId);
    return cached ?? undefined;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const res = await fetch(`/api/oneroster/students/${encodeURIComponent(sourcedId)}?fields=citizenshipStatus`, {
      cache: "no-store",
    });
    if (!res.ok) {
      citizenshipStatusCache.set(sourcedId, null);
      return undefined;
    }

    const payload = await res.json().catch(() => null);
    const remote = extractCitizenshipStatusFromStudentPayload(payload ?? undefined);
    if (remote && remote.trim().length > 0) {
      const trimmed = remote.trim();
      citizenshipStatusCache.set(sourcedId, trimmed);
      return trimmed;
    }

    citizenshipStatusCache.set(sourcedId, null);
    return undefined;
  } catch (error) {
    console.warn("Failed to resolve citizenshipStatus", error);
    citizenshipStatusCache.set(sourcedId, null);
    return undefined;
  }
}

export function findContactValue(
  contacts: PersonContact[] | undefined,
  keywords: string[],
  valuePredicate?: (value: string) => boolean,
): string | undefined {
  if (!contacts?.length) return undefined;
  const loweredKeywords = keywords.map((keyword) => keyword.toLowerCase());

  const scan = (requireKeyword: boolean) => {
    for (const contact of contacts) {
      if (!contact) continue;
      const type = contact.contactType?.toLowerCase?.() ?? "";
      const matchesKeyword = loweredKeywords.some((keyword) => keyword && type.includes(keyword));
      if (requireKeyword && !matchesKeyword) {
        continue;
      }

      const candidates = new Set<string>();
      if (typeof contact.value === "string") candidates.add(contact.value);
      if (typeof contact.note === "string") candidates.add(contact.note);
      for (const entry of Object.values(contact)) {
        if (typeof entry === "string") candidates.add(entry);
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

export function extractPersonContact(person?: Person | null): { phone?: string; email?: string } {
  if (!person) return {};
  const contacts = person.metadata?.contacts;
  const email = preferValue(
    person.email,
    findContactValue(contacts, ["email"], (value) => value.includes("@")),
  );
  const phone = preferValue(
    person.phone,
    person.sms,
    findContactValue(contacts, ["mobile", "phone", "tel"], (value) => /\d{3}/.test(value.replace(/\D/g, ""))),
  );
  return { phone, email };
}

export function isOrg(candidate: unknown): candidate is Org {
  if (!candidate || typeof candidate !== "object") return false;
  const record = candidate as Record<string, unknown>;
  return (
    typeof record.sourcedId === "string" ||
    typeof record.name === "string" ||
    (typeof record.metadata === "object" && record.metadata !== null)
  );
}

export function extractOrgFromAny(input: unknown): Org | null {
  if (!input) return null;
  if (isOrg(input)) return input as Org;
  if (typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (record.Org) return extractOrgFromAny(record.Org);
    if (record.org) return extractOrgFromAny(record.org);
  }
  return null;
}

export function collectOrgs(...sources: unknown[]): Org[] {
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

export function extractSchoolContact(org?: Org | null): { phone?: string; email?: string } {
  const contacts = org?.metadata?.contacts;
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return {};
  }

  let phone: string | undefined;
  let email: string | undefined;

  for (const rawContact of contacts) {
    if (!rawContact || typeof rawContact !== "object") continue;
    const contact = rawContact as Record<string, unknown>;
    const type = String(contact.contactType ?? contact.type ?? "").toLowerCase();

    const values = Object.values(contact)
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((value) => value.trim());

    if (!email) {
      const candidate =
        values.find((value) => value.includes("@")) ||
        (type.includes("email") ? values[0] : undefined);
      if (candidate) email = candidate;
    }

    if (!phone) {
      const candidate =
        values.find((value) => /\d{3}/.test(value.replace(/\D/g, ""))) ||
        (type.includes("phone") || type.includes("mobile") || type.includes("tel") ? values[0] : undefined);
      if (candidate) phone = candidate;
    }

    if (phone && email) break;
  }

  return { phone, email };
}

export function findLatestEnrollment(enrollments?: SchoolEnrollment[]): SchoolEnrollment | undefined {
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

export function extractStreamGradeName(
  streamGrades: Array<StreamGrade | null> | undefined,
  streamId?: string,
  locale: "ar" | "en" = "ar",
): string {
  if (!streamId || !streamGrades?.length) return "";
  const match = streamGrades
    .filter((item): item is StreamGrade => Boolean(item))
    .find((item) => item.streamGrade?.sourcedId === streamId);
  if (!match) return "";
  const sg = match.streamGrade;

  if (locale === "en") {
    return (
      preferValue(
        sg?.title,
        sg?.name,
        sg?.metadata?.titleArabic,
      ) ?? ""
    );
  }

  return (
    preferValue(
      sg?.metadata?.titleArabic,
      sg?.title,
      sg?.name,
    ) ?? ""
  );
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function parseDate(value: unknown): number {
  if (typeof value !== "string" || value.trim().length === 0) return 0;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getLatestSchool(
  allSchools: Org[],
  latestEnrollment?: SchoolEnrollment,
): Org | undefined {
  if (!latestEnrollment) {
    return allSchools[0];
  }
  const schoolId = latestEnrollment.school?.sourcedId;
  if (!schoolId) {
    return allSchools[0];
  }
  return allSchools.find((org) => org.sourcedId === schoolId) ?? allSchools[0];
}

export function resolveSchoolName(org: Org | undefined, locale: "ar" | "en" = "ar"): string {
  if (!org) return "";
  if (locale === "en") {
    return (
      preferValue(
        org.metadata?.englishName,
        org.name,
        org.metadata?.shortName,
      ) ?? ""
    );
  }
  return (
    preferValue(
      org.name,
      org.metadata?.englishName,
      org.metadata?.shortName,
    ) ?? ""
  );
}
