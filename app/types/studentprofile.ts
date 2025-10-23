// types/student-profile.v1.ts

export interface StudentContact {
  type: "Mobile" | "Email" | "OfficialEmail" | string;
  value: string;
}

export interface StudentAddress {
  country: string | null;
  state: string | null;
  city: string | null;
  region: string | null;
  verified: boolean;
  zipCode?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  poBox?: string | null;
  roadNumber?: string | null;
  plotId?: string | null;
  plotNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  addressLine3?: string | null;
  sector?: string | null;
}

export interface StudentEnrollment {
  id: string;                 // OneRoster enrollment sourcedId
  type: string | null;        // "Enrollment"
  entryType: string | null;   // e.g., "New Student"
  entryDate: string | null;   // ISO date (YYYY-MM-DD)
  exitDate: string | null;    // ISO date (YYYY-MM-DD) or null
  exitType: string | null;
  exitReason: string | null;
  isMandatoryEducation: boolean;
  isSpecialNeed: boolean;
  educationType: string | null;  // from schools table (private/public)
  schoolId: string | null;       // your local school key
  streamGradeId: string | null;  // your local streamGrade key
}

export interface StudentProfileV1 {
  id: string;               // SST-1-1-Pers-1687158
  username: string;
  status: string;           // "active" | "inactive" | ...
  role: string;             // "student" (as you set)

  firstNameArabic: string | null;
  middleNameArabic: string | null;
  lastNameArabic: string | null;

  gender: string | null;    // consider narrowing to "Male" | "Female" | "Other"
  dateOfBirth: string | null; // ISO date
  religion: string | null;

  emirateId: string | null;

  firstNameEnglish: string | null;
  middleNameEnglish: string | null;
  thirdNameEnglish: string | null;
  fourthNameEnglish: string | null;
  familyNameEnglish: string | null;

  studentNumber: string | null;
  userIds: string[];

  NationalityAR: string | null;  // e.g., "الأردن"
  NationalityEN: string | null;  // e.g., "Jordan"
  CitizenshipStatus: string | null; // e.g., "Expat Arab"

  birthPlaceCityAr: string | null;
  birthPlaceCityEn: string | null;
  birthPlaceCountryAr: string | null;
  birthPlaceCountryEn: string | null;

  contacts: StudentContact[];
  addresses: StudentAddress[];

  enrollment: StudentEnrollment[]; // array as you modeled
}
