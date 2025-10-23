// types/oneroster.ts

export interface StudentProfile {
  id: string; // OneRoster person/user sourcedId
  username: string;
  status: string;

  person: {
    givenName: string | null;
    middleName: string | null;
    familyName: string | null;
    gender: string | null;
    birthDate: string | null;
    religion: string | null;
  };

  namesEnglish: {
    first: string | null;
    second: string | null;
    third: string | null;
    fourth: string | null;
    family: string | null;
  };

  identifiers: {
    nationalId: string | null;
    studentNumber: string | null;
    userIds: string[];
  };

  nationality: {
    en: string | null;
    ar: string | null;
    citizenshipStatus?: string | null;
  };

  birthPlace: {
    city: { ar: string | null; en: string | null };
    country: { ar: string | null; en: string | null };
  };

  contacts: ContactInfo[];
  addresses: AddressInfo[];

  currentPlacement?: CurrentPlacement;

  flags: {
    enabledUser: boolean;
    isSpecialNeed: boolean;
  };

  metadata: {
    roleList: string[];
    sources: {
      person?: string;
      enrollment?: string;
      session?: string;
      school?: string;
      streamGrade?: string;
    };
    timestamps: {
      personLastModified?: string | null;
      enrollmentLastModified?: string | null;
      studentLastModified?: string | null;
    };
  };
}

export interface ContactInfo {
  type: "Mobile" | "Email" | "OfficialEmail" | "Other";
  value: string;
}

export interface AddressInfo {
  country: string | null;
  state: string | null;
  city: string | null;
  region: string | null;
  verified: boolean;
}

export interface CurrentPlacement {
  school: {
    id: string;
    name: string | null;
  };
  grade: {
    id: string;
    name: string | null;
  };
  streamGrade: {
    id: string;
    name: string | null;
    title: { en: string | null; ar: string | null };
    position: number | null;
  };
  educationPathId: string | null;
  session: {
    id: string;
    schoolYear: number | null;
  };
  enrollment: EnrollmentInfo;
}

export interface EnrollmentInfo {
  id: string;
  type: string | null;
  entryType: string | null;
  entryDate: string | null;
  exitDate: string | null;
  exitType: string | null;
  exitReason: string | null;
  isMandatoryEducation: boolean;
  isSpecialNeed: boolean;
  status: string | null;
}
