import type { StudentProfile, ContactInfo, AddressInfo, EnrollmentInfo, CurrentPlacement } from "@/app/types/studentprofile";
import type { Person, PersonAddress, PersonContact, SchoolEnrollment, Org, StreamGrade, PersonMetadata } from "@/types";

// Tolerant helpers for vendor payloads
function truthy(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toLowerCase() === "true";
  return false;
}

function toStringOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export function mapContacts(contacts?: PersonContact[] | null): ContactInfo[] {
  if (!Array.isArray(contacts)) return [];
  return contacts
    .map((c): ContactInfo | null => {
      const rawType = (c?.contactType || "").toString().toLowerCase();
      let type: ContactInfo["type"] = "Other";
      if (["mobile", "phone", "sms"].includes(rawType)) type = "Mobile";
      else if (rawType === "email") type = "Email";
      else if (rawType === "officialemail" || rawType === "official_email") type = "OfficialEmail";
      const value = toStringOrNull(c?.value);
      if (!value) return null;
      return { type, value };
    })
    .filter((x): x is ContactInfo => !!x);
}

export function mapAddresses(addresses?: PersonAddress[] | null): AddressInfo[] {
  if (!Array.isArray(addresses)) return [];
  return addresses.map((a): AddressInfo => ({
    country: toStringOrNull(a?.country),
    state: toStringOrNull(a?.state),
    city: toStringOrNull(a?.city),
    region: toStringOrNull(a?.region),
    verified: Boolean(a?.isVerified),
  }));
}

export function mapPersonToBaseProfile(person: Person): Omit<StudentProfile, "contacts" | "addresses" | "currentPlacement"> {
  const meta: PersonMetadata = (person.metadata ?? {}) as PersonMetadata;
  const enabled = truthy((person as Person).enabledUser);

  const namesEnglish = {
    first: toStringOrNull(meta.englishFirstName),
    second: toStringOrNull(meta.englishSecondName),
    third: toStringOrNull(meta.englishThirdName),
    fourth: toStringOrNull(meta.englishFourthName),
    family: toStringOrNull(meta.englishFamilyName),
  };

  // Safe string getter for open-ended metadata keys
  const pickMetaString = (m: Record<string, unknown>, key: string): string | null => {
    const v = m[key];
    return typeof v === "string" && v.trim() ? v : null;
  };

  const identifiers = {
    nationalId: toStringOrNull((person as unknown as { identifier?: string }).identifier),
    studentNumber: pickMetaString(meta as unknown as Record<string, unknown>, "studentNumber"), // may be absent
    userIds: typeof person.userIds === "string" && person.userIds.length
      ? person.userIds.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
  };

  const nationality = {
    en: toStringOrNull(meta.nationality),
    ar: toStringOrNull(meta.nationalityArabic),
    citizenshipStatus: pickMetaString(meta as unknown as Record<string, unknown>, "citizenshipStatus"),
  };

  const birthPlace = {
    city: {
      ar: toStringOrNull(meta.birthCity),
      en: toStringOrNull(meta.englishBirthCity),
    },
    country: {
      ar: toStringOrNull(meta.birthCountryArabic),
      en: toStringOrNull(meta.birthCountry),
    },
  };

  const roleList: string[] = (() => {
    const rl = meta.roleList as unknown;
    if (Array.isArray(rl)) return rl.map((x) => String(x));
    if (typeof rl === "string") return rl.split(",").map((s) => s.trim()).filter(Boolean);
    const arl = meta.activeRoleList as unknown;
    if (typeof arl === "string") return arl.split(",").map((s) => s.trim()).filter(Boolean);
    return [];
  })();

  return {
    id: person.sourcedId,
    username: person.username || "",
    status: String(person.status || ""),

    person: {
      givenName: toStringOrNull(person.givenName),
      middleName: toStringOrNull(person.middleName),
      familyName: toStringOrNull(person.familyName),
      gender: toStringOrNull(meta.gender),
      birthDate: toStringOrNull(meta.birthDate),
      religion: toStringOrNull(meta.religion),
    },

    namesEnglish,
    identifiers,
    nationality,
    birthPlace,

    flags: {
      enabledUser: enabled,
      isSpecialNeed: false, // may be updated from enrollment
    },

    metadata: {
      roleList,
      sources: {},
      timestamps: {
        personLastModified: toStringOrNull((person as unknown as { dateLastModified?: string }).dateLastModified),
        enrollmentLastModified: null,
        studentLastModified: null,
      },
    },
  };
}

export function pickLatestEnrollment(enrollments: SchoolEnrollment[]): SchoolEnrollment | null {
  if (!Array.isArray(enrollments) || enrollments.length === 0) return null;
  // Prefer active, then latest schoolYear, then latest dateLastModified
  const sorted = [...enrollments].sort((a, b) => {
    const aActive = String(a.status || "").toLowerCase() === "active" ? 1 : 0;
    const bActive = String(b.status || "").toLowerCase() === "active" ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;
    if ((a.schoolYear || 0) !== (b.schoolYear || 0)) return (b.schoolYear || 0) - (a.schoolYear || 0);
    const ad = Date.parse(a.dateLastModified || "1970-01-01");
    const bd = Date.parse(b.dateLastModified || "1970-01-01");
    return bd - ad;
  });
  return sorted[0] || null;
}

export function mapEnrollmentInfo(e: SchoolEnrollment | null): EnrollmentInfo | null {
  if (!e) return null;
  return {
    id: e.sourcedId,
    type: toStringOrNull(e.enrollmentType),
    entryType: toStringOrNull(e.entryType),
    entryDate: toStringOrNull(e.entryDate),
    exitDate: toStringOrNull(e.exitDate),
    exitType: toStringOrNull(e.exitType),
    exitReason: toStringOrNull(e.exitReason),
    isMandatoryEducation: String(e.isMandatoryEducation || "").toLowerCase() === "true",
    isSpecialNeed: Boolean(e.isSpecialNeed),
    status: toStringOrNull(e.status),
  };
}

export function mapOrgToSchool(org: Org | null): { id: string; name: string | null } | null {
  if (!org) return null;
  return {
    id: org.sourcedId,
    name: toStringOrNull(org.metadata?.englishName || org.metadata?.shortName || org.name),
  };
}

type StreamGradeNode = {
  sourcedId?: string;
  name?: string;
  title?: string;
  position?: number;
  metadata?: { titleArabic?: string } | null;
  grade?: { sourcedId?: string } | null;
  educationPath?: { sourcedId?: string } | null;
};

export function mapStreamGrade(
  sg: StreamGrade | StreamGradeNode | null
): { streamGrade: CurrentPlacement["streamGrade"]; gradeId: string | null; educationPathId: string | null } {
  if (!sg) {
    return {
      streamGrade: { id: "", name: null, title: { en: null, ar: null }, position: null },
      gradeId: null,
      educationPathId: null,
    };
  }

  // Tolerate either the envelope { streamGrade: {...} } or the node {...}
  const maybeEnvelope = sg as unknown as { streamGrade?: StreamGradeNode };
  const node: StreamGradeNode | null = maybeEnvelope && maybeEnvelope.streamGrade
    ? maybeEnvelope.streamGrade
    : (sg as StreamGradeNode);

  if (!node || typeof node.sourcedId !== "string") {
    return {
      streamGrade: { id: "", name: null, title: { en: null, ar: null }, position: null },
      gradeId: null,
      educationPathId: null,
    };
  }

  return {
    streamGrade: {
      id: node.sourcedId,
      name: toStringOrNull(node.name),
      title: { en: toStringOrNull(node.title), ar: toStringOrNull(node.metadata?.titleArabic) },
      position: typeof node.position === "number" ? node.position : null,
    },
    gradeId: toStringOrNull(node.grade?.sourcedId),
    educationPathId: toStringOrNull(node.educationPath?.sourcedId),
  };
}

export function mergeCurrentPlacement(
  base: StudentProfile,
  school: ReturnType<typeof mapOrgToSchool> | null,
  stream: ReturnType<typeof mapStreamGrade>,
  sessionId: string | null,
  schoolYear: number | null,
  enrollment: EnrollmentInfo | null
): StudentProfile {
  const grade = {
    id: stream.gradeId || "",
    name: null as string | null, // may be filled by route if grade fetched
  };
  return {
    ...base,
    flags: {
      ...base.flags,
      isSpecialNeed: (enrollment?.isSpecialNeed ?? base.flags.isSpecialNeed) || false,
    },
    currentPlacement: {
      school: school || { id: "", name: null },
      grade,
      streamGrade: stream.streamGrade,
      educationPathId: stream.educationPathId,
      session: { id: sessionId || "", schoolYear },
      enrollment: enrollment || {
        id: "",
        type: null,
        entryType: null,
        entryDate: null,
        exitDate: null,
        exitType: null,
        exitReason: null,
        isMandatoryEducation: false,
        isSpecialNeed: false,
        status: null,
      },
    },
  };
}
