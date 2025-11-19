// Centralized shared types for the app
import type { ComponentType, SVGProps } from "react";

 

 

 

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  badge?: string;
}

// --- Mock/demo data types (used by app/data/mockData.ts) ---
export interface Child {
  id: string;
  name: string;
  grade: string;
  classroom: string;
  teacher: string;
  avatar: string;
  attendanceRate: number;
  latestGrade: string;
  nextEvent: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string; // ISO date string
  category: "school" | "class" | "urgent";
  tags: string[];
}

export interface MessageThread {
  id: string;
  participants: string[];
  subject: string;
  lastMessage: string;
  lastMessageTime: string; // ISO datetime
  unreadCount: number;
  avatar?: string;
}

export interface Message {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: string; // ISO datetime
  read: boolean;
  avatar?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO date string
  time?: string;
  type: "event" | "exam" | "meeting" | "holiday";
  description?: string;
}

export interface Attendance {
  date: string; // ISO date string
  status: "present" | "absent" | "late";
  notes?: string;
}

export interface Grade {
  id: string;
  subject: string;
  assignment: string;
  grade: string;
  maxGrade: string;
  date: string; // ISO date string
  teacher: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string; // ISO date string
  status: "pending" | "completed" | "overdue";
  description?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  children: Child[];
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
  };
}

// --- Header/Menu types ---
export interface MenuLink {
  label: string;
  href: string;
  icon?: string;
  key?: string;
}

export interface MenuGroup {
  title?: string | null;
  links: MenuLink[];
}

export interface MenuItem {
  label: string;
  href?: string;
  icon?: string;
  key?: string;
  children?: MenuGroup[];
}

export interface MenuData {
  items: MenuItem[];
}

// --- OneRoster derived types used in lib/roster-repo ---
// --- OneRoster person details (parent) ---
export interface PersonContact {
  note?: string;
  contactType?: string;
  isPrivate?: boolean;
  value?: string;
}

export interface PersonAddress {
  country?: string;
  zipCode?: string;
  city?: string;
  isVerified?: boolean;
  latitude?: string;
  poBox?: string;
  roadNumber?: string;
  plotId?: string;
  addressLine1?: string;
  plotNumber?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  region?: string;
  sector?: string;
  longitude?: string;
}

export interface PersonMetadata {
  englishSecondName?: string;
  birthName?: string;
  birthDate?: string;
  maritalStatus?: string;
  birthCountry?: string;
  birthCity?: string;
  nationalityArabic?: string;
  englishThirdName?: string;
  gender?: string;
  englishFirstName?: string;
  religion?: string;
  englishBirthCity?: string;
  birthCountryArabic?: string;
  englishFamilyName?: string;
  roleList?: string;
  nationality?: string;
  englishFourthName?: string;
  activeRoleList?: string;
  contacts?: PersonContact[];
  addresses?: PersonAddress[];
  // Allow vendor-specific extras
  [key: string]: unknown;
}

export interface Person {
  // Required by repository code
  sourcedId: string;

  // Role and identity
  role?: string; // e.g., "parent"
  type?: string; // e.g., "Real User"
  status?: string; // e.g., "active"
  enabledUser?: boolean | string; // some vendors send "true" as string
  identifier?: string; // national id
  username?: string;
  userIds?: string;

  // Names
  givenName?: string; // Arabic given name in sample
  middleName?: string;
  familyName?: string; // Arabic family name in sample

  // Contact info
  email?: string;
  phone?: string;
  sms?: string;

  // Additional attributes from sample
  agents?: string;
  grades?: string;
  password?: string;
  dateLastModified?: string; // ISO string

  // Rich metadata block
  metadata?: PersonMetadata;
}

export type StudentBasic = {
  sourcedId: string;
  givenName?: string;
  familyName?: string;
  grade?: string;
  username?: string;
};

export type SchoolEnrollment = {
  sourcedId: string;
  entryType: string;
  exitType: string;
  note: string;
  exitReason: string;
  entryDate: string;
  student: {
    href: string;
    sourcedId: string;
    type: string;
  };
  session: {
    href: string;
    sourcedId: string;
    type: string;
  };
  community: {
    href: string;
    sourcedId: string;
    type: string;
  };
  dateLastModified: string;
  isSpecialNeed: boolean;
  school: {
    href: string;
    sourcedId: string;
    type: string;
     educationType?: string;
  };
  schoolYear: number;
  streamGrade: {
    href: string;
    sourcedId: string;
    type: string;
  };
  enrollmentType: string;
  exitDate: string;
  status: string;
  isMandatoryEducation: string;
  createDate: string;
};

 

 
export interface Org {
  sourcedId: string;
  metadata: OrgMetadata;
  identifier?: string;
  parent?: OrgRef[];
  manager?: OrgRef;
  type?: string;
  dateLastModified?: string;
  name?: string;
}

export interface OrgMetadata {
  type: string;
  note?: string;
  shortName?: string;
  contacts?: Array<Record<string, unknown>>; // adjust if you know structure
  guid?: string;
  addresses?: OrgAddress[];
  englishName?: string;
  status?: string;
}

export interface OrgAddress {
  country?: string;
  zipCode?: string;
  city?: string;
  isVerified?: boolean;
  latitude?: string;
  poBox?: string;
  roadNumber?: string;
  plotId?: string;
  addressLine1?: string;
  plotNumber?: string;
  addressLine2?: string;
  addressLine3?: string;
  state?: string;
  region?: string;
  sector?: string;
  longitude?: string;
}

export interface OrgRef {
  href: string;
  sourcedId: string;
  type: string;
}

export interface StreamGrade {
  streamGrade: {
    sourcedId: string;
    metadata: {
      titleArabic: string;
    };
    dateLastModified: string; // ISO date string
    grade: {
      href: string;
      sourcedId: string;
      type: "grades";
    };
    name: string;
    educationPath: {
      href: string;
      sourcedId: string;
      type: "educationPaths";
    };
    position: number;
    title: string;
    status: "active" | "inactive";
  };
}

// --- Onwani/MyLand selection types ---
export type Municipality = "ADM" | "AAM" | "WRM";

export type PlotLookupTitles = {
  ar: string | null;
  en: string | null;
};

export type PlotLookupHierarchy = {
  region: {
    id: number | null;
    emirateId: number | null;
    titles: PlotLookupTitles;
    isActive: boolean;
  };
  zone: {
    id: number | null;
    regionId: number | null;
    titles: PlotLookupTitles;
    isActive: boolean;
  };
  area: {
    id: number | null;
    zoneId: number | null;
    titles: PlotLookupTitles;
    isActive: boolean;
    manhalCode: string | null;
  };
};

export type PlotLookupRecord = {
  plot: {
    id: number | null;
    titles: PlotLookupTitles;
    isActive: boolean;
  };
  identifiers: {
    plotId: number | null;
    areaId: number | null;
    premisesPlotId: string | null;
    mainPlotPromiseId: string | null;
    mainPlotId: string | null;
  };
  location: {
    coordinates: {
      latitude: string | null;
      longitude: string | null;
    };
    roadNumber: string | null;
    onwani: {
      mapMapping: string;
      legacyKey: string;
    };
  };
  hierarchy: PlotLookupHierarchy;
};

export type PlotLookupResponse = {
  data: PlotLookupRecord[];
  meta: {
    filter: string;
    areaId: number | null;
    regionId?: number | null;
    zoneId?: number | null;
    count: number;
    mainPlotPromiseId: string;
  };
};

// Onwani Map Response Structure (from MyLand iframe postMessage)
export interface OnwaniMapResponse {
  AddressType: "Plot" | "Onwani" | "Pin" | "PinDrop" | "Coordinate";
  AddressValue_EN: string;
  AddressValue_AR: string;
  InputCoordinates: {
    Lat: number | string;
    Lng: number | string;
  };
  PlotAddress?: {
    MUNICIPALITYENG: string;
    MUNICIPALITYARA: string;
    DISTRICTENG: string;
    DISTRICTARA: string;
    COMMUNITYENG: string;
    COMMUNITYARA: string;
    GISID: string;
    PLOTNUMBER: string;
    ROADID: string;
  };
  OnwaniAddress?: {
    MUNICIPALITYENG: string;
    MUNICIPALITYARA: string;
    DISTRICTENG: string;
    DISTRICTARA: string;
    COMMUNITYENG: string;
    COMMUNITYARA: string;
    GISID: string;
    Lng: number | string;
    Lat: number | string;
    PlotAddress?: string;
  };
}

export interface OnwaniSelection {
  municipality: Municipality;

  districtEn: string;
  communityEn: string;
  // Only applicable for AAM municipality
  roadId?: string;
  // Plot is user-entered; there is no public endpoint in this app for lookups
  plot?: string;
  // Full formatted address from Onwani
  addressValueEn?: string;
  addressValueAr?: string;
  // Optional overlay geometry returned by the getcommunityshape endpoint
  shapeGeoJSON?: unknown;
  // Optional backend response attached when map lookup succeeds (DEPRECATED - use onwaniMapResponse)
  dbPlotResponse?: PlotLookupResponse;
  // RAW Onwani map response (complete data from map postMessage)
  onwaniMapResponse?: OnwaniMapResponse;
}

// Re-export notification types
export type { Notification, NotificationType, NotificationData, NotificationCount, NotificationFilter } from "./notification";