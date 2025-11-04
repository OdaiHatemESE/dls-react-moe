import type {
  StudentProfileV1,
  StudentContact,
  StudentAddress,
  StudentEnrollment,
} from "@/app/types/studentprofile";
import type { Person, PersonAddress, PersonContact, SchoolEnrollment, PersonMetadata } from "@/types";

// Tolerant helpers for vendor payloads

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export function mapContacts(contacts?: PersonContact[] | null): StudentContact[] {
  if (!Array.isArray(contacts)) return [];
  const mapped = contacts
    .map((c): StudentContact | null => {
      const rawType = (c?.contactType || "").toString().toLowerCase();
      let type: StudentContact["type"] = "Other";
      if (["mobile", "phone", "sms"].includes(rawType)) type = "Mobile";
      else if (rawType === "email") type = "Email";
      else if (rawType === "officialemail" || rawType === "official_email") type = "OfficialEmail";
      const value = toStringOrNull(c?.value);
      if (!value) return null;
      return { type, value, isPrimary: false };
    })
    .filter((x): x is StudentContact => !!x);
  
  // Mark first contact as primary
  if (mapped.length > 0) {
    mapped[0].isPrimary = true;
  }
  
  return mapped;
}

export function mapAddresses(addresses?: PersonAddress[] | null): StudentAddress[] {
  if (!Array.isArray(addresses)) return [];
  const mapped = addresses.map((a): StudentAddress => ({
    country: toStringOrNull(a?.country),
    state: toStringOrNull(a?.state),
    city: toStringOrNull(a?.city),
    region: toStringOrNull(a?.region),
    verified: Boolean(a?.isVerified),
    isPrimary: false,
    zipCode: toStringOrNull((a as PersonAddress)?.zipCode),
    latitude: toStringOrNull((a as PersonAddress)?.latitude),
    longitude: toStringOrNull((a as PersonAddress)?.longitude),
    poBox: toStringOrNull((a as PersonAddress)?.poBox),
    roadNumber: toStringOrNull((a as PersonAddress)?.roadNumber),
    plotId: toStringOrNull((a as PersonAddress)?.plotId),
    plotNumber: toStringOrNull((a as PersonAddress)?.plotNumber),
    addressLine1: toStringOrNull((a as PersonAddress)?.addressLine1),
    addressLine2: toStringOrNull((a as PersonAddress)?.addressLine2),
    addressLine3: toStringOrNull((a as PersonAddress)?.addressLine3),
    sector: toStringOrNull((a as PersonAddress)?.sector),
  }));
  
  // Mark first address as primary
  if (mapped.length > 0) {
    mapped[0].isPrimary = true;
  }
  
  return mapped;
}
/**
 * Map OneRoster SchoolEnrollment[] to simplified StudentEnrollment[] for API response
 */
export function mapEnrollments(enrollments?: SchoolEnrollment[] | null): StudentEnrollment[] {
  if (!Array.isArray(enrollments)) return [];
  return enrollments.map((e): StudentEnrollment => ({
    id: e.sourcedId,
    type: toStringOrNull(e.enrollmentType),
    entryType: toStringOrNull(e.entryType),
    entryDate: toStringOrNull(e.entryDate),
    exitDate: toStringOrNull(e.exitDate),
    exitType: toStringOrNull(e.exitType),
    exitReason: toStringOrNull(e.exitReason),
    isMandatoryEducation: String(e.isMandatoryEducation || "").toLowerCase() === "true",
    isSpecialNeed: Boolean(e.isSpecialNeed),
    educationType: toStringOrNull(e.school?.educationType as unknown as string),
    schoolId: toStringOrNull(e.school?.sourcedId),
    streamGradeId: toStringOrNull(e.streamGrade?.sourcedId),
    schoolYear: e.schoolYear ? String(e.schoolYear) : null,
  }));
}

/**
 * Map OneRoster Person to StudentProfileV1 base fields (excluding contacts/addresses/enrollment arrays)
 */
export function mapPersonToProfileV1(person: Person, studentExtras?: { studentNumber?: string | null; citizenshipStatus?: string | null }): Omit<StudentProfileV1, "contacts" | "addresses" | "enrollment"> {
  const meta: PersonMetadata = (person.metadata ?? {}) as PersonMetadata;

  // Helper: safe string from metadata
  const pickMetaString = (m: Record<string, unknown>, key: string): string | null => {
    const v = m[key];
    return typeof v === "string" && v.trim() ? v : null;
  };

  const userIds: string[] = typeof person.userIds === "string" && person.userIds.length
    ? person.userIds.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return {
    id: person.sourcedId,
    username: person.username || "",
    status: String(person.status || ""),
    role: toStringOrNull(person.role) || "student",

    firstNameArabic: toStringOrNull(person.givenName),
    middleNameArabic: toStringOrNull(person.middleName),
    lastNameArabic: toStringOrNull(person.familyName),

    gender: toStringOrNull(meta.gender),
    dateOfBirth: toStringOrNull(meta.birthDate),
    religion: toStringOrNull(meta.religion),

    emirateId: toStringOrNull((person as unknown as { identifier?: string }).identifier),

    firstNameEnglish: toStringOrNull(meta.englishFirstName),
    middleNameEnglish: toStringOrNull(meta.englishSecondName),
    thirdNameEnglish: toStringOrNull(meta.englishThirdName),
    fourthNameEnglish: toStringOrNull(meta.englishFourthName),
    familyNameEnglish: toStringOrNull(meta.englishFamilyName),

    studentNumber: studentExtras?.studentNumber ?? pickMetaString(meta as unknown as Record<string, unknown>, "studentNumber"),
    userIds,

    NationalityAR: toStringOrNull(meta.nationalityArabic) as string | null,
    NationalityEN: toStringOrNull(meta.nationality) as string | null,
    CitizenshipStatus: studentExtras?.citizenshipStatus ?? pickMetaString(meta as unknown as Record<string, unknown>, "citizenshipStatus"),

    birthPlaceCityAr: toStringOrNull(meta.birthCity),
    birthPlaceCityEn: toStringOrNull(meta.englishBirthCity),
    birthPlaceCountryAr: toStringOrNull(meta.birthCountryArabic),
    birthPlaceCountryEn: toStringOrNull(meta.birthCountry),
  };
}
